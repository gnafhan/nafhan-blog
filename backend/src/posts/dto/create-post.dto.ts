import { IsString, IsNotEmpty, IsOptional, MinLength, Matches } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Title must not be empty' })
  @Matches(/\S/, { message: 'Title must contain at least one non-whitespace character' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Content must not be empty' })
  @Matches(/\S/, { message: 'Content must contain at least one non-whitespace character' })
  content: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;
}
