import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('posts/:id/comments')
  async create(
    @Param('id') postId: string,
    @Request() req: any,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(
      postId,
      req.user._id.toString(),
      createCommentDto,
    );
  }

  @Get('posts/:id/comments')
  async findByPost(@Param('id') postId: string) {
    return this.commentsService.findByPost(postId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('comments/:id')
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, req.user._id.toString(), updateCommentDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.commentsService.delete(id, req.user._id.toString());
    return { message: 'Comment deleted successfully' };
  }
}
