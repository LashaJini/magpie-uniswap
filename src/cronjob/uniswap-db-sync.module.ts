import { Module } from '@nestjs/common';
import { UniswapModule } from 'src/graph/uniswap.module';
import { DatabaseModule } from 'src/storage/database/database.module';
import { UniswapDbSyncService } from './uniswap-db-sync.service';

@Module({
  imports: [
    DatabaseModule,
    UniswapModule,
  ],
  providers: [UniswapDbSyncService],
  exports: [UniswapDbSyncService]
})
export class UniswapDbSyncModule { }
