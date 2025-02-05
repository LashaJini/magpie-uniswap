import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { gql, GraphQLClient } from 'graphql-request';
import { Pool } from './uniswap/schema/pool/pool.schema';

@Injectable()
export class UniswapService {
  private readonly logger = new Logger(UniswapService.name);
  private readonly graphqlClient: GraphQLClient;
  private apiURL: string;

  private static readonly POOL_QUERY = gql`
      query ($id: String!) {
        pool(id: $id){
          ticks{
            id
            tickIdx
            price0
            price1
          }
          token0 {
            symbol
            id
            name
          }
          token1 {
            symbol
            id
            name
          }
          feeTier
          sqrtPrice
          liquidity
          id
        }
      }
    `;

  constructor(private readonly configService: ConfigService) {
    this.apiURL = this.configService.getOrThrow("UNISWAP_ENDPOINT")
    this.graphqlClient = new GraphQLClient(this.apiURL);
  }

  async findPoolByID(id: string): Promise<Pool | null> {
    try {
      const response = await this.graphqlClient.request<{ pool: Pool | null }>(UniswapService.POOL_QUERY, { id });

      if (!response.pool) {
        this.logger.warn(`No pool found with ID: ${id}`);
        return null;
      }

      return response.pool;
    } catch (error) {
      this.logger.error(`Failed to fetch pool with ID: ${id}`, error);
      throw error;
    }
  }
}
