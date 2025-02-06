import { ConsoleLogger, LoggerService } from '@nestjs/common';

export class CustomLogger extends ConsoleLogger implements LoggerService {
  log(message: string) {
    if (process.env.NODE_ENV !== 'test') {
      super.log(message);
    }
  }

  error(message: string, trace: string) {
    if (process.env.NODE_ENV !== 'test') {
      super.error(message, trace);
    }
  }

  warn(message: string) {
    if (process.env.NODE_ENV !== 'test') {
      super.warn(message);
    }
  }
}

