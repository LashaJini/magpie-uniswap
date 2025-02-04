import { Field, ID, ObjectType } from "@nestjs/graphql";
import { GraphQLBigInt } from "graphql-scalars";

/**
 * based on https://github.com/Uniswap/v3-subgraph/blob/main/schema.graphql#L144
 */
@ObjectType({ description: "tick" })
export class Tick {
  @Field(() => ID)
  id: string;

  @Field(() => GraphQLBigInt)
  tickIdx: number;

  @Field()
  price0: number;

  @Field()
  price1: number;
}

