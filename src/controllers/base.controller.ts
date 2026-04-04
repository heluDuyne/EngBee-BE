/**
 * Base controller with unified response handling
 */

import { Controller } from "tsoa";
import { isHttpException } from "../exceptions/HttpException";

/**
 * Unified API response format
 * @template T The type of the response data
 */
export interface ApiResponse<T = any> {
  /**
   * Indicates if the request was successful
   * @isBoolean
   */
  isSuccess: boolean;

  /**
   * Response message
   * @isString
   */
  message?: string;

  /**
   * Response data (can be single item or paginated)
   */
  data?: T;

  /**
   * Error message if request failed
   * @isString
   */
  error?: string;

  /**
   * HTTP status code
   * @isInt
   */
  statusCode: number;

  /**
   * ISO 8601 timestamp of the response
   * @isString
   */
  timestamp: string;
}

export abstract class BaseController extends Controller {
  protected getResponse<T = any>(
    data: T | null = null,
    isSuccess: boolean = true,
    message: string = "",
    statusCode: number = 200,
    error: string = ""
  ): ApiResponse<T> {
    this.setStatus(statusCode);

    return {
      isSuccess,
      message: message || (isSuccess ? "Success" : "Failed"),
      data: data || undefined,
      error: error || undefined,
      statusCode,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Helper for success response
   * @template T The type of response data
   * @param data The response data
   * @param message Optional success message
   * @param statusCode Optional status code (default: 200)
   */
  protected successResponse<T = any>(
    data: T,
    message: string = "Success",
    statusCode: number = 200
  ): ApiResponse<T> {
    return this.getResponse(data, true, message, statusCode);
  }

  /**
   * Helper for created response (201)
   * @template T The type of response data
   * @param data The created resource
   * @param message Optional success message
   */
  protected createdResponse<T = any>(
    data: T,
    message: string = "Resource created successfully"
  ): ApiResponse<T> {
    return this.getResponse(data, true, message, 201);
  }

  /**
   * Helper for error response
   * @param error Error message or Error object
   * @param statusCode HTTP status code
   */
  protected errorResponse(
    error: string | Error,
    statusCode: number = 400
  ): ApiResponse<null> {
    const message = error instanceof Error ? error.message : error;
    return this.getResponse(null, false, "", statusCode, message);
  }

  /**
   * Helper for not found response (404)
   * @param error Optional error message
   */
  protected notFoundResponse(error: string = "Resource not found"): ApiResponse<null> {
    return this.getResponse(null, false, "", 404, error);
  }

  /**
   * Helper for no content response (204)
   */
  protected noContentResponse(): void {
    this.setStatus(204);
  }

  protected async handleAsync<T = any>(
    handler: () => Promise<T>,
    successMessage: string = "Success",
    successStatusCode: number = 200
  ): Promise<ApiResponse<T | null>> {
    try {
      const data = await handler();
      return this.getResponse(data, true, successMessage, successStatusCode);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      const statusCode = this.extractStatusCode(error);
      return this.getResponse(null, false, "", statusCode, errorMessage) as ApiResponse<T | null>;
    }
  }

  private extractStatusCode(error: any): number {
    // Check if error is an HttpException (from services)
    if (isHttpException(error)) {
      return error.statusCode;
    }

    // Check if error has statusCode property
    if (error?.statusCode && typeof error.statusCode === "number") {
      return error.statusCode;
    }

    // Check error message for common patterns
    const message = error?.message?.toLowerCase() || "";
    if (message.includes("not found")) return 404;
    if (message.includes("already exists") || message.includes("duplicate")) return 409;
    if (message.includes("unauthorized")) return 401;
    if (message.includes("forbidden")) return 403;
    if (message.includes("validation") || message.includes("invalid")) return 400;

    // Default to 500 for unknown errors
    return 500;
  }

  protected async executeService<T = any>(
    serviceCall: () => Promise<T>,
    successMessage: string = "Success",
    statusCode: number = 200
  ): Promise<ApiResponse<T | null>> {
    try {
      const data = await serviceCall();
      return this.getResponse(data, true, successMessage, statusCode);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      const code = this.extractStatusCode(error);
      return this.getResponse(null, false, "", code, message) as ApiResponse<T | null>;
    }
  }
}
