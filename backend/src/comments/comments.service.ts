import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async create(
    postId: string,
    userId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const trimmedContent = createCommentDto.content.trim();
    
    if (!trimmedContent) {
      throw new ForbiddenException('Content cannot be empty or whitespace only');
    }
    
    const comment = new this.commentModel({
      content: trimmedContent,
      post: new Types.ObjectId(postId),
      author: new Types.ObjectId(userId),
    });
    return comment.save();
  }

  async findByPost(postId: string): Promise<Comment[]> {
    return this.commentModel
      .find({ post: new Types.ObjectId(postId) })
      .populate('author', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    id: string,
    userId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.commentModel.findById(id).exec();

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author.toString() !== userId) {
      throw new ForbiddenException(
        'You can only modify your own comments',
      );
    }

    if (updateCommentDto.content) {
      const trimmedContent = updateCommentDto.content.trim();
      if (!trimmedContent) {
        throw new ForbiddenException('Content cannot be empty or whitespace only');
      }
      comment.content = trimmedContent;
    }
    
    comment.updatedAt = new Date();
    return comment.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.commentModel.findById(id).exec();

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author.toString() !== userId) {
      throw new ForbiddenException(
        'You can only delete your own comments',
      );
    }

    await this.commentModel.findByIdAndDelete(id).exec();
  }

  async deleteByPost(postId: string): Promise<void> {
    await this.commentModel
      .deleteMany({ post: new Types.ObjectId(postId) })
      .exec();
  }
}
