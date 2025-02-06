import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import { CustomLogger } from './common/logger/custom-logger.service';

// Load and expand environment variables
dotenvExpand.expand(dotenv.config({ path: ".env.prod" }));

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLogger(),
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
