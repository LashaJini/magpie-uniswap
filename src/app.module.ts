import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UniswapModule } from './graph/uniswap.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './storage/database/database.service';
import { DatabaseModule } from './storage/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    UniswapModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseService],
})
export class AppModule { }
