import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { InternalServerErrorException } from '../exceptions/HttpException';
import { Readable } from 'stream';

export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(file: any, folder: string = 'engbee/submissions'): Promise<string> {
    return new Promise((resolve, reject) => {
        let options: any = { 
            folder: folder,
            resource_type: "auto" 
        };

        if (file.originalname) {
            // Sanitize original name to avoid Cloudinary invalid public_id errors
            // Remove extension, replace non-alphanumeric with underscore, limit length
            const nameWithoutExt = file.originalname.substring(0, file.originalname.lastIndexOf('.')) || file.originalname;
            const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
            options.public_id = `${sanitized}_${Date.now()}`;
        }

        // Use upload_stream for buffer
        const uploadStream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) {
                    console.error("Cloudinary upload error:", error);
                    return reject(new InternalServerErrorException("Failed to upload file to storage"));
                }
                if (!result) {
                    return reject(new InternalServerErrorException("Upload result is empty"));
                }
                resolve(result.secure_url);
            }
        );

        // create a buffer stream from the file buffer
        const stream = Readable.from(file.buffer);
        stream.pipe(uploadStream);
    });
  }
}

export const cloudinaryService = new CloudinaryService();
