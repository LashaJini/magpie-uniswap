import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private static initialized = false;
  private readonly logger = new Logger(DatabaseService.name);
  private readonly maxRetries = 3;
  private readonly retryDelayMilliSeconds = 2000;
  private pool: Pool;

  constructor(private configService: ConfigService) {
    this.pool = new Pool({
      user: this.configService.getOrThrow("DB_USER"),
      host: this.configService.get("DB_HOST") ?? "localhost",
      database: this.configService.getOrThrow("DB_NAME"),
      password: this.configService.getOrThrow("DB_PASS"),
      port: this.configService.getOrThrow("DB_PORT"),
    })
  }

  async onModuleInit() {
    if (DatabaseService.initialized) {
      this.logger.warn('DatabaseService already initialized. Skipping...');
      return;
    }

    DatabaseService.initialized = true;
    await this.connectWithRetry();
  }

  async connectWithRetry(retries = 0): Promise<void> {
    try {
      await this.pool.query("SELECT version()");
      this.logger.log('PostgreSQL connected.');
    } catch (error) {
      this.logger.warn(`Database connection failed (attempt ${retries + 1}/${this.maxRetries})`);

      if (retries < this.maxRetries) {
        this.logger.log(`Retrying in ${this.retryDelayMilliSeconds / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelayMilliSeconds));
        return this.connectWithRetry(retries + 1);
      }

      this.logger.error('Max retries reached. Could not connect to PostgreSQL.');
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('PostgreSQL disconnected.');
  }

  async query<T = any>(text: string, params?: any[]): Promise<T | T[]> {
    const result = await this.pool.query(text, params);
    return result.rows;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query("SELECT version()");
      return true;
    } catch {
      return false;
    }
  }
}
