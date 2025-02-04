import { Field, ID, ObjectType } from "@nestjs/graphql";

/**
 * based on https://github.com/Uniswap/v3-subgraph/blob/main/schema.graphql#L38
 */
@ObjectType({ description: "token" })
export class Token {
  @Field(() => ID)
  id: string;

  @Field()
  symbol: string;

  @Field()
  name: string;
}
