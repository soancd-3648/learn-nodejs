import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';
import { Category } from '../../database/entities';

@Controller('categories')
export class CategoriesController {
  constructor(@InjectRepository(Category) private readonly repository: Repository<Category>) {}

  @Public()
  @Get()
  findAll() {
    return this.repository.find({ order: { name: 'ASC' } });
  }
}
