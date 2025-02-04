import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
  constructor(private readonly dbService: DatabaseService) { }

  @Get('health')
  async healthCheck() {
    const isHealthy = await this.dbService.healthCheck();
    return isHealthy ? { status: 'up' } : { status: 'down' };
  }
}
