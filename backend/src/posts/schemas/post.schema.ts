import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true, minlength: 1 })
  title: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true, minlength: 1 })
  content: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: null })
  category: string;

  @Prop({ type: String, default: null })
  thumbnail: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId | User;

  @Prop({ default: 0 })
  claps: number;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Create unique index on slug for URL-friendly lookups
PostSchema.index({ slug: 1 }, { unique: true });

// Create text index on title and content for search functionality
PostSchema.index({ title: 'text', content: 'text' });
