import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

export interface CommentWithReplies {
  _id: Types.ObjectId;
  content: string;
  post: Types.ObjectId;
  author: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    profilePicture?: string;
  };
  parentComment: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  replies: CommentWithReplies[];
}

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
      throw new ForbiddenException(
        'Content cannot be empty or whitespace only',
      );
    }

    // Validate parentCommentId if provided
    let parentCommentId: Types.ObjectId | null = null;
    if (createCommentDto.parentCommentId) {
      const parentComment = await this.commentModel
        .findById(createCommentDto.parentCommentId)
        .exec();

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      // Validate parent comment belongs to the same post
      if (parentComment.post.toString() !== postId) {
        throw new BadRequestException(
          'Parent comment must belong to the same post',
        );
      }

      parentCommentId = new Types.ObjectId(createCommentDto.parentCommentId);
    }

    const comment = new this.commentModel({
      content: trimmedContent,
      post: new Types.ObjectId(postId),
      author: new Types.ObjectId(userId),
      parentComment: parentCommentId,
    });
    const savedComment = await comment.save();

    // Populate author before returning
    return this.commentModel
      .findById(savedComment._id)
      .populate('author', 'name email profilePicture')
      .exec() as Promise<Comment>;
  }

  async findByPost(postId: string): Promise<CommentWithReplies[]> {
    const comments = await this.commentModel
      .find({ post: new Types.ObjectId(postId) })
      .populate('author', 'name email profilePicture')
      .sort({ createdAt: 1 })
      .exec();

    return this.buildCommentTree(comments);
  }

  buildCommentTree(comments: CommentDocument[]): CommentWithReplies[] {
    const map = new Map<string, CommentWithReplies>();
    const roots: CommentWithReplies[] = [];

    // First pass: create map of all comments with empty replies array
    comments.forEach((comment) => {
      const commentObj = comment.toObject();
      map.set(commentObj._id.toString(), {
        ...commentObj,
        replies: [],
      } as CommentWithReplies);
    });

    // Second pass: build tree structure
    comments.forEach((comment) => {
      const commentObj = comment.toObject();
      const node = map.get(commentObj._id.toString())!;

      if (commentObj.parentComment) {
        const parentNode = map.get(commentObj.parentComment.toString());
        if (parentNode) {
          parentNode.replies.push(node);
        } else {
          // Parent not found, treat as root
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
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
      throw new ForbiddenException('You can only modify your own comments');
    }

    if (updateCommentDto.content) {
      const trimmedContent = updateCommentDto.content.trim();
      if (!trimmedContent) {
        throw new ForbiddenException(
          'Content cannot be empty or whitespace only',
        );
      }
      comment.content = trimmedContent;
    }

    comment.updatedAt = new Date();
    await comment.save();

    // Populate author before returning
    return this.commentModel
      .findById(id)
      .populate('author', 'name email profilePicture')
      .exec() as Promise<Comment>;
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.commentModel.findById(id).exec();

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Delete the comment and all its nested replies
    await this.deleteWithReplies(id);
  }

  /**
   * Recursively deletes a comment and all its nested replies.
   * This implements cascade delete for nested comments.
   */
  async deleteWithReplies(commentId: string): Promise<number> {
    // Find all direct replies to this comment
    const replies = await this.commentModel
      .find({ parentComment: new Types.ObjectId(commentId) })
      .exec();

    let deletedCount = 0;

    // Recursively delete all replies first
    for (const reply of replies) {
      deletedCount += await this.deleteWithReplies(reply._id.toString());
    }

    // Delete the comment itself
    await this.commentModel.findByIdAndDelete(commentId).exec();
    deletedCount += 1;

    return deletedCount;
  }

  async deleteByPost(postId: string): Promise<void> {
    await this.commentModel
      .deleteMany({ post: new Types.ObjectId(postId) })
      .exec();
  }
}
