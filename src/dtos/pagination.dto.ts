/**
 * Common pagination and list response DTOs
 */

/**
 * Query parameters for paginated list requests
 * @example {
 *   "limit": 10,
 *   "offset": 0
 * }
 */
export class PaginationQueryDTO {
  /**
   * Number of items to return per page
   * @isInt
   * @minimum 1
   * @maximum 100
   * @default 10
   * @isNumber
   */
  limit?: number = 10;

  /**
   * Number of items to skip from the beginning
   * @isInt
   * @minimum 0
   * @default 0
   * @isNumber
   */
  offset?: number = 0;
}

/**
 * Pagination metadata included in paginated responses
 */
export class PaginationMetaDTO {
  /**
   * Number of items requested per page
   * @isInt
   * @minimum 1
   * @maximum 100
   */
  limit!: number;

  /**
   * Number of items skipped from the beginning
   * @isInt
   * @minimum 0
   */
  offset!: number;

  /**
   * Total number of items available
   * @isInt
   * @minimum 0
   */
  total!: number;

  /**
   * Total number of pages (calculated)
   * @isInt
   * @minimum 1
   */
  pages?: number;

  /**
   * Current page number (calculated, 1-indexed)
   * @isInt
   * @minimum 1
   */
  currentPage?: number;

  /**
   * Whether there are more items available after current page
   * @isBoolean
   */
  hasMore?: boolean;
}

/**
 * Generic paginated list response wrapper
 * Provides a consistent response structure for all list endpoints with pagination metadata
 * @template T The type of items in the list
 * @example {
 *   "data": [
 *     { "id": "1", "name": "Item 1" },
 *     { "id": "2", "name": "Item 2" }
 *   ],
 *   "pagination": {
 *     "limit": 10,
 *     "offset": 0,
 *     "total": 25,
 *     "pages": 3,
 *     "currentPage": 1,
 *     "hasMore": true
 *   }
 * }
 */
export class PaginatedResponseDTO<T> {
  /**
   * Array of items for the current page
   * @isArray
   */
  data!: T[];

  /**
   * Pagination metadata
   */
  pagination!: PaginationMetaDTO;
}
