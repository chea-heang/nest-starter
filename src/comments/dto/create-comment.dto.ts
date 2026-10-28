import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Comment content cannot be empty' })
  @MinLength(1, { message: 'Comment must be at least 1 character long' })
  @MaxLength(1000, { message: 'Comment must not exceed 1000 characters' })
  content: string;
}
