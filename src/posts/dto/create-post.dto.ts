import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Content must be at least 10 characters long' })
  content: string;

  @IsString()
  @IsOptional()
  @MaxLength(300, { message: 'Summary must not exceed 300 characters' })
  summary?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
