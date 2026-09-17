import { IsInt, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateRegistrationDto {
  @IsUUID()
  ticketTypeId!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  quantity!: number;

  @IsString()
  @MaxLength(80)
  idempotencyKey!: string;
}
