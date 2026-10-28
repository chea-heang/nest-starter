import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class QueryPostDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsString()
  authorId?: string;
}
