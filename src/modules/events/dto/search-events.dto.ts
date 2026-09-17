import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EventStatus } from '../../../common/enums/event-status.enum';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class SearchEventsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
