import { IsNotEmpty, IsString, MinLength, IsOptional, IsMongoId } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsMongoId()
  parentCommentId?: string;
}
