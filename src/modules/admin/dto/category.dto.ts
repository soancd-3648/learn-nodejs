import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;
}
