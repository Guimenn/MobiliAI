import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageKitService } from './imagekit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly imagekitService: ImageKitService) {}

  @Post('product-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('productId') productId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo fornecido');
    }

    if (!productId) {
      throw new BadRequestException('productId é obrigatório');
    }

    const url = await this.imagekitService.uploadProductImage(file, productId);
    return { url };
  }

  @Delete('delete-image')
  async deleteImage(@Body('imageUrl') imageUrl: string) {
    if (!imageUrl) {
      throw new BadRequestException('imageUrl é obrigatório');
    }

    await this.imagekitService.deleteProductImage(imageUrl);
    return { success: true };
  }

  @Get('product-images/:productId')
  async getProductImages(@Param('productId') productId: string) {
    const imageUrls = await this.imagekitService.listProductImages(productId);
    return { imageUrls };
  }

  @Get('all-images')
  async getAllImages() {
    const images = await this.imagekitService.listAllProductImages();
    return { images };
  }

  @Post('user-avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadUserAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo fornecido');
    }

    if (!userId) {
      throw new BadRequestException('userId é obrigatório');
    }

    const url = await this.imagekitService.uploadUserAvatar(file, userId);
    return { url };
  }

  @Post('store-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadStoreImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('storeId') storeId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo fornecido');
    }

    if (!storeId) {
      throw new BadRequestException('storeId é obrigatório');
    }

    const url = await this.imagekitService.uploadStoreImage(file, storeId);
    return { url };
  }

  @Delete('user-avatar')
  async deleteUserAvatar(@Body('imageUrl') imageUrl: string) {
    if (!imageUrl) {
      throw new BadRequestException('imageUrl é obrigatório');
    }

    await this.imagekitService.deleteUserAvatar(imageUrl);
    return { success: true };
  }

  @Delete('store-image')
  async deleteStoreImage(@Body('imageUrl') imageUrl: string) {
    if (!imageUrl) {
      throw new BadRequestException('imageUrl é obrigatório');
    }

    await this.imagekitService.deleteStoreImage(imageUrl);
    return { success: true };
  }
}

