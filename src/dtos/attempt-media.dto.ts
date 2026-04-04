import { MediaType } from "../enums";

/**
 * AttemptMedia DTOs
 */

/**
 * @example {
 *   "attemptId": "attempt-123",
 *   "mediaType": "AUDIO",
 *   "storageUrl": "https://storage.example.com/audio-123.mp3",
 *   "fileName": "audio-123.mp3",
 *   "duration": 120,
 *   "fileSize": 1024000,
 *   "mimeType": "audio/mpeg"
 * }
 */
export class CreateAttemptMediaDTO {
  /**
   * ID of the attempt
   */
  attemptId!: string;

  mediaType!: MediaType;

  /**
   * URL where media is stored
   */
  storageUrl!: string;

  /**
   * Original file name
   */
  fileName!: string;

  /**
   * Duration in seconds
   */
  duration?: number;

  /**
   * File size in bytes
   * @max 104857600
   */
  fileSize?: number;

  mimeType?: string;
}

/**
 * @example {
 *   "fileName": "updated-audio.mp3",
 *   "duration": 130
 * }
 */
export class UpdateAttemptMediaDTO {
  fileName?: string;
  duration?: number;
  fileSize?: number;
}

/**
 * @example {
 *   "id": "media-1",
 *   "attemptId": "attempt-123",
 *   "mediaType": "AUDIO",
 *   "storageUrl": "https://storage.example.com/audio-123.mp3",
 *   "fileName": "audio-123.mp3",
 *   "duration": 120,
 *   "fileSize": 1024000,
 *   "mimeType": "audio/mpeg",
 *   "uploadedAt": "2024-11-14T10:05:00Z"
 * }
 */
export class AttemptMediaResponseDTO {
  id!: string;
  attemptId!: string;
  mediaType!: MediaType;
  storageUrl!: string;
  fileName!: string;
  duration?: number;
  fileSize?: number;
  mimeType?: string;
  uploadedAt!: Date;
}

/**
 * @example {
 *   "id": "media-1",
 *   "fileName": "audio-123.mp3",
 *   "mediaType": "AUDIO",
 *   "duration": 120,
 *   "uploadedAt": "2024-11-14T10:05:00Z"
 * }
 */
export class AttemptMediaListDTO {
  id!: string;
  fileName!: string;
  mediaType!: MediaType;
  duration?: number;
  uploadedAt!: Date;
}

/**
 * @example {
 *   "mediaType": "AUDIO",
 *   "fileName": "speaking-attempt.mp3"
 * }
 */
export class UploadMediaDTO {
  mediaType!: MediaType;

  /**
   * Original file name
   */
  fileName!: string;

  // File data handled by multipart middleware
}
