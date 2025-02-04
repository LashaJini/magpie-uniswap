import { Field, ID, ObjectType } from "@nestjs/graphql";
import { GraphQLBigInt } from "graphql-scalars";
import { Token } from "../token/token.schema";
import { Tick } from "../tick/tick.schema";

/**
 * based on https://github.com/Uniswap/v3-subgraph/blob/main/schema.graphql#L77
 */
@ObjectType({ description: "pool" })
export class Pool {
  @Field(() => ID)
  id: string;

  @Field(() => GraphQLBigInt)
  feeTier: number;

  @Field(() => GraphQLBigInt)
  sqrtPrice: number;

  @Field(() => GraphQLBigInt)
  liquidity: number;

  @Field(() => Token)
  token0: Token;

  @Field(() => Token)
  token1: Token;

  @Field(() => [Tick])
  ticks: Tick[];
}

