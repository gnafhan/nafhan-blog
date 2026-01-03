import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Ensure content-images directory exists
const contentImagesDir = './uploads/content-images';
if (!existsSync(contentImagesDir)) {
  mkdirSync(contentImagesDir, { recursive: true });
}

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

// File filter for image validation
const imageFileFilter = (
  req: ExpressRequest,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return callback(
      new BadRequestException(
        'Only image files are allowed (JPEG, PNG, WebP, GIF)',
      ),
      false,
    );
  }
  callback(null, true);
};

// Storage configuration for content images
const contentImageStorage = diskStorage({
  destination: contentImagesDir,
  filename: (
    req: ExpressRequest,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void,
  ) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `content-${uniqueSuffix}${ext}`);
  },
});

@Controller('images')
export class ImagesController {
  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: contentImageStorage,
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadContentImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const url = `/uploads/content-images/${file.filename}`;
    return { url };
  }
}
