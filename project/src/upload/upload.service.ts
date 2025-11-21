import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageKitService } from './imagekit.service';

@Injectable()
export class UploadService {
  constructor(
    private configService: ConfigService,
    private imagekitService: ImageKitService,
  ) {}

  async uploadProductImage(file: Express.Multer.File, productId: string): Promise<string> {
    return this.imagekitService.uploadProductImage(file, productId);
  }

  async uploadMultipleProductImages(files: Express.Multer.File[], productId: string): Promise<string[]> {
    return this.imagekitService.uploadMultipleProductImages(files, productId);
  }

  async deleteProductImage(imageUrl: string): Promise<void> {
    return this.imagekitService.deleteProductImage(imageUrl);
  }
}