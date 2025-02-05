export class PoolTickInsertDTO {
  poolId: string;
  tickId: string;

  constructor(poolId: string, tickId: string) {
    this.poolId = poolId;
    this.tickId = tickId;
  }
}
