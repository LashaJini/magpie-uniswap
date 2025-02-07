import { Module } from '@nestjs/common';
import { UniswapEthersModule } from 'src/graph/uniswap-ethers/uniswap-ethers.module';
import { DatabaseModule } from 'src/storage/database/database.module';
import { UniswapDbSyncService } from './uniswap-db-sync.service';

@Module({
  imports: [
    DatabaseModule,
    UniswapEthersModule,
  ],
  providers: [UniswapDbSyncService],
  exports: [UniswapDbSyncService]
})
export class UniswapDbSyncModule { }
