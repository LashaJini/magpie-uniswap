import { ConsoleLogger, LoggerService } from '@nestjs/common';

export class CustomLogger extends ConsoleLogger implements LoggerService {
  log(message: any, ...optionalParams: [...any, string?]) {
    if (process.env.NODE_ENV !== 'test') {
      super.log(message, ...optionalParams);
    }
  }

  error(message: string, trace?: string) {
    if (process.env.NODE_ENV !== 'test') {
      super.error(message, trace);
    }
  }

  warn(message: string, ...optionalParams: [...any, string?]) {
    if (process.env.NODE_ENV !== 'test') {
      super.warn(message, ...optionalParams);
    }
  }
}

