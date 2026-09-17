import { IsJWT, IsString, MaxLength, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @IsJWT()
  refreshToken!: string;
}

export class VerifyEmailDto {
  @IsJWT()
  token!: string;
}

export class ResetPasswordDto {
  @IsJWT()
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}
