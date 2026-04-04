import { Response } from "tsoa";


export interface AuthOptions {
  roles?: string[];
  optional?: boolean;
  description?: string;
}

export function Auth(options?: string[] | AuthOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Store auth metadata on the method
    const authConfig: AuthOptions = {
      optional: false,
    };

    if (typeof options === "string") {
      // Single role as string
      authConfig.roles = [options];
    } else if (Array.isArray(options)) {
      // Multiple roles as array
      authConfig.roles = options;
    } else if (options) {
      // Full options object
      Object.assign(authConfig, options);
    }

    Reflect.defineMetadata("auth:config", authConfig, target, propertyKey);

    return descriptor;
  };
}

/**
 * Require specific role(s)
 * Shorthand for @Auth({ roles: [...] })
 *
 * @example
 * @Post()
 * @RequireRole("teacher")
 * async createPrompt(@Body() dto: CreatePromptDTO, @Security("bearer") _auth: any) { }
 */
export function RequireRole(roles: string | string[]) {
  return Auth(Array.isArray(roles) ? roles : [roles]);
}

/**
 * Allow any authenticated user (any role)
 *
 * @example
 * @Get()
 * @Authenticated()
 * async getMyProfile(@Security("bearer") _auth: any) { }
 */
export function Authenticated() {
  return Auth({});
}

/**
 * Allow authenticated or optional authentication
 *
 * @example
 * @Get()
 * @OptionalAuth()
 * async getPublicData(@Security("bearer", ["optional"]) _auth?: any) { }
 */
export function OptionalAuth() {
  return Auth({ optional: true });
}

/**
 * Require teacher or admin role
 *
 * @example
 * @Post()
 * @TeacherOnly()
 * async createClass(@Body() dto: CreateClassDTO, @Security("bearer") _auth: any) { }
 */
export function TeacherOnly() {
  return Auth(["teacher", "admin"]);
}

/**
 * Require admin role only
 *
 * @example
 * @Delete()
 * @AdminOnly()
 * async deleteUser(@Path() id: string, @Security("bearer") _auth: any) { }
 */
export function AdminOnly() {
  return Auth(["admin"]);
}

/**
 * Require learner role only
 *
 * @example
 * @Get()
 * @LearnerOnly()
 * async getMyProgress(@Security("bearer") _auth: any) { }
 */
export function LearnerOnly() {
  return Auth(["learner"]);
}

/**
 * Helper to get auth metadata from a method
 * Used by middleware/filters to enforce auth
 */
export function getAuthMetadata(target: any, propertyKey: string): AuthOptions | undefined {
  return Reflect.getMetadata("auth:config", target, propertyKey);
}

/**
 * Check if method requires authentication
 */
export function requiresAuth(target: any, propertyKey: string): boolean {
  const metadata = getAuthMetadata(target, propertyKey);
  return metadata ? !metadata.optional : false;
}

/**
 * Get required roles from metadata
 */
export function getRequiredRoles(target: any, propertyKey: string): string[] | undefined {
  const metadata = getAuthMetadata(target, propertyKey);
  return metadata?.roles;
}
