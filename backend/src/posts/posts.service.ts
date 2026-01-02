import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { Comment, CommentDocument } from '../comments/schemas/comment.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    const newPost = new this.postModel({
      title: createPostDto.title.trim(),
      content: createPostDto.content.trim(),
      description: createPostDto.description,
      category: createPostDto.category,
      author: userId,
    });
    return newPost.save();
  }

  async findAll(query: QueryPostsDto): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (search) {
      filter = { $text: { $search: search } };
    }

    const [data, total] = await Promise.all([
      this.postModel
        .find(filter)
        .populate('author', 'name email profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findById(id: string): Promise<Post> {
    const post = await this.postModel
      .findById(id)
      .populate('author', 'name email profilePicture')
      .exec();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async update(
    id: string,
    userId: string,
    updatePostDto: UpdatePostDto,
  ): Promise<Post> {
    const post = await this.postModel.findById(id).exec();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Compare author ID directly (post.author is ObjectId when not populated)
    if ((post.author as Types.ObjectId).toString() !== userId) {
      throw new ForbiddenException('You can only modify your own resources');
    }

    // Trim string fields if they exist
    if (updatePostDto.title) {
      post.title = updatePostDto.title.trim();
    }
    if (updatePostDto.content) {
      post.content = updatePostDto.content.trim();
    }
    if (updatePostDto.description !== undefined) {
      post.description = updatePostDto.description;
    }
    if (updatePostDto.category !== undefined) {
      post.category = updatePostDto.category;
    }
    
    post.updatedAt = new Date();
    return post.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const post = await this.postModel.findById(id).exec();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Compare author ID directly (post.author is ObjectId when not populated)
    if ((post.author as Types.ObjectId).toString() !== userId) {
      throw new ForbiddenException('You can only modify your own resources');
    }

    // Cascade delete: remove all comments associated with this post
    await this.commentModel.deleteMany({ post: id }).exec();

    // Delete the post
    await this.postModel.findByIdAndDelete(id).exec();
  }

  async findByAuthor(userId: string): Promise<Post[]> {
    return this.postModel
      .find({ author: userId })
      .populate('author', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .exec();
  }
}
