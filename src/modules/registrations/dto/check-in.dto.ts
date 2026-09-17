import { IsString, Length } from 'class-validator';

export class CheckInDto {
  @IsString()
  @Length(64, 64)
  qrToken!: string;
}
