import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Name must be a string' })
  name: string;

  @IsEmail({}, { message: 'Must be a valid email' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Must be a valid email' })
  email: string;

  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  refresh_token: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email' })
  email?: string;
}
