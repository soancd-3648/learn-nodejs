import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  async check() {
    await this.dataSource.query('SELECT 1');
    return { status: 'ok', database: 'up', redis: process.env.NODE_ENV === 'test' ? 'disabled' : 'configured' };
  }
}
