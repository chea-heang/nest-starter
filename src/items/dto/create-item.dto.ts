import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min, MinLength } from 'class-validator';

export class CreateItemDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  readonly name: string;

  @IsNumber({}, { message: 'Price must be a number' })
  @IsPositive({ message: 'Price must be greater than 0' })
  readonly price: number;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  readonly description?: string;
}

export class UpdateItemDto extends PartialType(CreateItemDto) {}

export class GetItemsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsPositive()
  limit: number = 10;
  
  @IsOptional()
  @Min(1)
  page: number = 1;
}
