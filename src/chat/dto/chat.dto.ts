import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  room: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  room: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @IsOptional()
  @IsString()
  guestName?: string;
}

export class TypingDto {
  @IsString()
  @IsNotEmpty()
  room: string;

  @IsBoolean()
  @IsNotEmpty()
  isTyping: boolean;
}
