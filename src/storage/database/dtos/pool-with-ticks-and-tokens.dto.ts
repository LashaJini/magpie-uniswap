import { Pool } from "src/graph/uniswap/schema/pool/pool.schema";
import { TickUpsertDTO } from "./tick-upsert.dto";
import { TokenInsertDTO } from "./token-insert.dto";

export class PoolWithTicksAndTokensDTO {
  id: string;
  feeTier: number;
  sqrtPrice: number;
  liquidity: number;
  token0: TokenInsertDTO;
  token1: TokenInsertDTO;
  ticks: TickUpsertDTO[];

  constructor(id: string, feeTier: number, sqrtPrice: number, liquidity: number, token0: TokenInsertDTO, token1: TokenInsertDTO, ticks: TickUpsertDTO[]) {
    this.id = id;
    this.feeTier = feeTier;
    this.sqrtPrice = sqrtPrice;
    this.liquidity = liquidity;
    this.token0 = token0;
    this.token1 = token1;
    this.ticks = ticks;
  }

  static fromSchema(pool: Pool) {
    return new PoolWithTicksAndTokensDTO(
      pool.id,
      pool.feeTier,
      pool.sqrtPrice,
      pool.liquidity,
      pool.token0,
      pool.token1,
      pool.ticks,
    );
  }
}
