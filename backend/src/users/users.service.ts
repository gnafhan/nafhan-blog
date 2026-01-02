import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async create(userData: { name: string; email: string; password: string }): Promise<User> {
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  async getProfileWithPosts(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      return null;
    }
    const posts = await this.postModel.find({ author: userId }).exec();
    
    const userObj = (user as any).toObject();
    return {
      ...userObj,
      posts,
    };
  }

  async updateProfilePicture(userId: string, profilePictureUrl: string): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { profilePicture: profilePictureUrl },
      { new: true },
    ).exec();
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
}
