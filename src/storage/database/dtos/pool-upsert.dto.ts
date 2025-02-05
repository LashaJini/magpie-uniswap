export class PoolUpsertDTO {
  id: string;
  feeTier: number;
  sqrtPrice: number;
  liquidity: number;
  token0Id: string; // Foreign key referring to Token ID
  token1Id: string; // Foreign key referring to Token ID

  constructor(id: string, feeTier: number, sqrtPrice: number, liquidity: number, token0Id: string, token1Id: string) {
    this.id = id;
    this.feeTier = feeTier;
    this.sqrtPrice = sqrtPrice;
    this.liquidity = liquidity;
    this.token0Id = token0Id;
    this.token1Id = token1Id;
  }
}

