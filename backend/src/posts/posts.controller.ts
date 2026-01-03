import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Request as ExpressRequest } from 'express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Ensure thumbnails directory exists
const thumbnailsDir = './uploads/thumbnails';
if (!existsSync(thumbnailsDir)) {
  mkdirSync(thumbnailsDir, { recursive: true });
}

// Allowed image MIME types for thumbnails
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

// Storage configuration for thumbnails
const thumbnailStorage = diskStorage({
  destination: thumbnailsDir,
  filename: (
    req: ExpressRequest,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void,
  ) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `thumbnail-${uniqueSuffix}${ext}`);
  },
});

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: thumbnailStorage,
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async create(
    @Request() req: any,
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Get thumbnail URL if file was uploaded
    const thumbnailUrl = file ? `/uploads/thumbnails/${file.filename}` : null;

    return this.postsService.create(
      req.user._id.toString(),
      createPostDto,
      thumbnailUrl,
    );
  }

  @Get()
  async findAll(@Query() query: QueryPostsDto) {
    return this.postsService.findAll(query);
  }

  @Get('by-slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.postsService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: thumbnailStorage,
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Determine thumbnail URL
    let thumbnailUrl: string | null | undefined = undefined;

    if (file) {
      // New file uploaded
      thumbnailUrl = `/uploads/thumbnails/${file.filename}`;
    } else if (updatePostDto.removeThumbnail === 'true') {
      // Explicitly remove thumbnail
      thumbnailUrl = null;
    }

    return this.postsService.update(
      id,
      req.user._id.toString(),
      updatePostDto,
      thumbnailUrl,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.postsService.delete(id, req.user._id.toString());
    return { message: 'Post deleted successfully' };
  }

  @Post(':id/clap')
  async clap(@Param('id') id: string) {
    return this.postsService.addClap(id);
  }
}
