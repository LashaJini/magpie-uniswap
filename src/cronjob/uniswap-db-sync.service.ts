import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UniswapEthersService } from '../graph/uniswap-ethers/uniswap-ethers.service';
import { CustomLogger } from '../common/logger/custom-logger.service';
import { DatabaseService } from '../storage/database/database.service';

@Injectable()
export class UniswapDbSyncService {
  private readonly logger = new CustomLogger(UniswapDbSyncService.name)

  constructor(
    private databaseService: DatabaseService,
    private uniswapService: UniswapEthersService
  ) { }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    this.logger.log("Starting cron job for Uniswap DB synchronization");

    const pool = await this.uniswapService.findPoolByID()

    this.logger.log(pool)
    if (pool) {
      const tickIndices = await this.uniswapService.calculateTickIndices();
      const ticks = await this.uniswapService.getAllTicks(tickIndices);
      pool.ticks = ticks

      await this.databaseService.insertPoolWithTicksAndTokens(pool);
    }
  }
}
