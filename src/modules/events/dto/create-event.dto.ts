import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateTicketTypeDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsNumberString()
  price!: string;

  @IsInt()
  @Min(1)
  capacity!: number;
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @MaxLength(255)
  venue!: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsUUID()
  categoryId!: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTicketTypeDto)
  ticketTypes!: CreateTicketTypeDto[];
}
