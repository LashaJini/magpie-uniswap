import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { UniswapDbSyncModule } from './cronjob/uniswap-db-sync.module';
import { UniswapDbSyncService } from './cronjob/uniswap-db-sync.service';
import { UniswapEthersModule } from './graph/uniswap-ethers/uniswap-ethers.module';
import { UniswapModule } from './graph/uniswap/uniswap.module';
import { DatabaseModule } from './storage/database/database.module';
import { DatabaseService } from './storage/database/database.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.prod',
    }),
    ScheduleModule.forRoot(),
    UniswapModule,
    UniswapEthersModule,
    DatabaseModule,
    UniswapDbSyncModule,
    UniswapEthersModule,
  ],
  controllers: [],
  providers: [DatabaseService, UniswapDbSyncService],
})
export class AppModule { }
