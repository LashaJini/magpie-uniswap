import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UniswapService } from 'src/graph/uniswap.service';
import { DatabaseService } from 'src/storage/database/database.service';

@Injectable()
export class UniswapDbSyncService {
  private readonly logger = new Logger(UniswapDbSyncService.name)

  constructor(
    private databaseService: DatabaseService,
    private uniswapService: UniswapService
  ) { }

  @Cron("0 */30 * * * *")
  async handleCron() {
    this.logger.log("Starting cron job for Uniswap DB synchronization");

    const id = "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8"
    const pool = await this.uniswapService.findPoolByID(id)

    if (pool) {
      await this.databaseService.insertPoolWithTicksAndTokens(pool);
    }
  }
}
