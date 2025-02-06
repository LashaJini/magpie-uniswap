import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CustomLogger } from '../common/logger/custom-logger.service';
import { UniswapService } from '../graph/uniswap/uniswap.service';
import { DatabaseService } from '../storage/database/database.service';

@Injectable()
export class UniswapDbSyncService {
  private readonly logger = new CustomLogger(UniswapDbSyncService.name)

  constructor(
    private databaseService: DatabaseService,
    private uniswapService: UniswapService
  ) { }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    this.logger.log("Starting cron job for Uniswap DB synchronization");

    const id = "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8"
    const pool = await this.uniswapService.findPoolByID(id)

    if (pool) {
      const ticks = await this.uniswapService.fetchTicksInBatches(id)
      pool.ticks = ticks ?? []
      await this.databaseService.insertPoolWithTicksAndTokens(pool);
    }
  }
}
