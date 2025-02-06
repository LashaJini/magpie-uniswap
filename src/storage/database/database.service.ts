import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { PoolTickInsertDTO } from './dtos/pool-tick-insert.dto';
import { PoolUpsertDTO } from './dtos/pool-upsert.dto';
import { PoolWithTicksAndTokensDTO } from './dtos/pool-with-ticks-and-tokens.dto';
import { TickUpsertDTO } from './dtos/tick-upsert.dto';
import { TokenInsertDTO } from './dtos/token-insert.dto';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private static initialized = false;
  private readonly logger = new CustomLogger(DatabaseService.name);
  private readonly maxRetries = 3;
  private readonly retryDelayMilliSeconds = 2000;
  private pool: Pool;

  readonly Table = {
    token: "token",
    tick: "tick",
    pool: "pool",
    poolTick: "pool_tick",
  };

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

  async queryTx<T = any>(text: string, params?: any[], tx?: PoolClient): Promise<T | T[]> {
    this.logger.warn('Executing query:', text);
    this.logger.log('With parameters:', params);

    const client = tx || this.pool;
    const result = await client.query(text, params);
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

  async insertToken(token: TokenInsertDTO, tx?: PoolClient): Promise<string> {
    const query = `
      INSERT INTO ${this.Table.token} (id, symbol, name)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO NOTHING
      RETURNING id;
    `;

    const parameters = [
      token.id,
      token.symbol,
      token.name,
    ];

    const result = await this.queryTx(query, parameters, tx);

    // no conflict: the result will contain the inserted id
    // conflict: the result will be empty and return null or undefined
    return result.length > 0 ? result[0].id : token.id;
  }

  async upsertTick(tick: TickUpsertDTO, tx?: PoolClient): Promise<string> {
    const query = `
      INSERT INTO ${this.Table.tick} (id, tick_idx, price0, price1) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) 
      DO UPDATE
        SET tick_idx = EXCLUDED.tick_idx,
            price0 = EXCLUDED.price0,
            price1 = EXCLUDED.price1
      RETURNING id;
    `;

    const parameters = [
      tick.id,
      tick.tickIdx,
      tick.price0,
      tick.price1,
    ];

    const result = await this.queryTx(query, parameters, tx);

    return result.length > 0 ? result[0].id : tick.id;
  }

  async upsertPool(pool: PoolUpsertDTO, tx?: PoolClient): Promise<string> {
    const query = `
      INSERT INTO ${this.Table.pool} 
      (id, fee_tier, sqrt_price, liquidity, token0_id, token1_id) 
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) 
      DO UPDATE 
        SET fee_tier = EXCLUDED.fee_tier,
            sqrt_price = EXCLUDED.sqrt_price,
            liquidity = EXCLUDED.liquidity,
            token0_id = EXCLUDED.token0_id,
            token1_id = EXCLUDED.token1_id
      RETURNING id;
    `;

    const parameters = [
      pool.id,
      pool.feeTier,
      pool.sqrtPrice,
      pool.liquidity,
      pool.token0Id,
      pool.token1Id,
    ];

    const result = await this.queryTx(query, parameters, tx);

    return result.length > 0 ? result[0].id : pool.id;
  }

  async insertPoolTick(poolTick: PoolTickInsertDTO, tx?: PoolClient): Promise<void> {
    const query = `
      INSERT INTO ${this.Table.poolTick} (pool_id, tick_id)
      VALUES ($1, $2)
      ON CONFLICT (pool_id, tick_id) DO NOTHING;
    `;

    await this.queryTx(query, [poolTick.poolId, poolTick.tickId], tx);
  }

  async insertPoolWithTicksAndTokens(pool: PoolWithTicksAndTokensDTO): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      for (const token of [pool.token0, pool.token1]) {
        await this.insertToken(token, client)
      }

      for (const tick of pool.ticks) {
        await this.upsertTick(tick, client)
      }

      const poolId = await this.upsertPool(new PoolUpsertDTO(
        pool.id,
        pool.feeTier,
        pool.sqrtPrice,
        pool.liquidity,
        pool.token0.id,
        pool.token1.id,
      ), client)

      for (const tick of pool.ticks) {
        const poolTick = new PoolTickInsertDTO(poolId, tick.id)
        await this.insertPoolTick(poolTick, client)
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
