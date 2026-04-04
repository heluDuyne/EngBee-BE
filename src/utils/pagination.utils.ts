import { PaginatedResponseDTO } from "../dtos/pagination.dto";

/**
 * Pagination utility functions for consistent handling across the application
 */

/**
 * Validates and normalizes pagination parameters
 * @param limit - Number of items per page (default: 10)
 * @param offset - Number of items to skip (default: 0)
 * @returns Validated pagination parameters
 */
export function validatePaginationParams(
  limit: number = 10,
  offset: number = 0
): { limit: number; offset: number } {
  const validLimit = Math.max(1, Math.min(100, Math.floor(limit) || 10));
  const validOffset = Math.max(0, Math.floor(offset) || 0);
  return { limit: validLimit, offset: validOffset };
}

/**
 * Creates a paginated response with metadata
 * @template T The type of items in the list
 * @param data - Array of items for the current page
 * @param total - Total number of items available
 * @param limit - Number of items per page
 * @param offset - Number of items skipped
 * @returns Paginated response DTO with metadata
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number
): PaginatedResponseDTO<T> {
  const pages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const hasMore = offset + limit < total;

  return {
    data,
    pagination: {
      limit,
      offset,
      total,
      pages,
      currentPage,
      hasMore,
    },
  };
}

/**
 * Extracts limit and offset from query parameters with defaults
 * Useful for controllers that need to parse query strings
 * @param limit - Query limit parameter
 * @param offset - Query offset parameter
 * @returns Validated pagination parameters
 */
export function extractPaginationParams(
  limit?: number,
  offset?: number
): { limit: number; offset: number } {
  return validatePaginationParams(limit, offset);
}
