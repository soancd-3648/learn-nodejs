import { ArrayNotEmpty, IsArray, IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';
import { UserStatus } from '../../../common/enums/user-status.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
