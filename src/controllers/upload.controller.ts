import { Controller, Post, Route, Request, Security, Tags, Response, UploadedFile } from "tsoa";
import { cloudinaryService } from "../services/cloudinary.service";
import { Authenticated } from "../decorators/auth.decorator";
import express from "express";

@Route("upload")
@Tags("Upload")
export class UploadController extends Controller {
  
  /**
   * Upload a file (audio/video/image) and get the URL
   */
  @Post()
  @Security("bearer")
  @Authenticated()
  @Response(201, "File uploaded successfully")
  public async uploadFile(
    @Request() request: express.Request,
    @UploadedFile() file: Express.Multer.File
  ): Promise<{ url: string }> {
    if (!file) {
        this.setStatus(400);
        throw new Error("No file uploaded");
    }

    const url = await cloudinaryService.uploadFile(file);
    return { url };
  }
}
