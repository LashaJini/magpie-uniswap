CREATE TABLE IF NOT EXISTS token (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tick (
  id TEXT PRIMARY KEY,
  tick_idx BIGINT NOT NULL,
  price0 NUMERIC NOT NULL,
  price1 NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS pool (
  id TEXT PRIMARY KEY,
  fee_tier BIGINT NOT NULL,

  -- according to https://github.com/Uniswap/v3-subgraph/blob/main/schema.graphql#L93
  -- type of sqrtPrice is BigInt in graphql schema, however
  -- it seems that it's larger than postgres' BIGINT type. Thus, the NUMERIC type.
  sqrt_price NUMERIC NOT NULL,

  liquidity BIGINT NOT NULL,
  token0_id TEXT NOT NULL REFERENCES token(id) ON DELETE CASCADE,
  token1_id TEXT NOT NULL REFERENCES token(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pool_tick (
  pool_id TEXT NOT NULL REFERENCES pool(id) ON DELETE CASCADE,
  tick_id TEXT NOT NULL REFERENCES tick(id) ON DELETE CASCADE,
  PRIMARY KEY (pool_id, tick_id)
);
