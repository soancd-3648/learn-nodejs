import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { RegistrationStatus } from '../../../common/enums/registration-status.enum';

export class SearchRegistrationsDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;

  @IsOptional()
  @IsString()
  q?: string;
}
