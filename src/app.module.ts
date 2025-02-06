import { Module } from '@nestjs/common';
import { UniswapModule } from './graph/uniswap/uniswap.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './storage/database/database.service';
import { DatabaseModule } from './storage/database/database.module';
import { UniswapDbSyncService } from './cronjob/uniswap-db-sync.service';
import { UniswapDbSyncModule } from './cronjob/uniswap-db-sync.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.prod',
    }),
    ScheduleModule.forRoot(),
    UniswapModule,
    DatabaseModule,
    UniswapDbSyncModule,
  ],
  controllers: [],
  providers: [DatabaseService, UniswapDbSyncService],
})
export class AppModule { }
