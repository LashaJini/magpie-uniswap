import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { gql, GraphQLClient } from 'graphql-request';
import { CustomLogger } from '../common/logger/custom-logger.service';
import { Pool } from './uniswap/schema/pool/pool.schema';
import { Tick } from './uniswap/schema/tick/tick.schema';

@Injectable()
export class UniswapService {
  private readonly logger = new CustomLogger(UniswapService.name);
  private readonly graphqlClient: GraphQLClient;
  private apiURL: string;

  private static readonly POOL_QUERY = gql`
      query ($id: String!, $first: Int!, $skip: Int!) {
        pool(id: $id){
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

  private static readonly TICKS_QUERY = gql`
      query ($id: String!, $first: Int!, $skip: Int!) {
        pool(id: $id){
          ticks(first: $first, skip: $skip){
            id
            tickIdx
            price0
            price1
          }
        }
      }
    `;


  constructor(private readonly configService: ConfigService) {
    this.apiURL = this.configService.getOrThrow("UNISWAP_ENDPOINT")
    this.graphqlClient = new GraphQLClient(this.apiURL);
  }

  async fetchTicksInBatches(id: string, batchSize: number = 1000): Promise<Tick[] | null> {
    let allTicks: Tick[] = [];
    let skip = 0;
    let hasMoreTicks = true;

    while (hasMoreTicks) {
      try {
        const response = await this.graphqlClient.request<{ pool: Pool | null }>(
          UniswapService.TICKS_QUERY,
          { id, first: batchSize, skip }
        );

        if (!response || !response.pool || !response.pool.ticks || response.pool.ticks.length === 0) {
          hasMoreTicks = false;
          break;
        }

        allTicks = [...allTicks, ...response.pool.ticks];
        skip += batchSize;
        this.logger.log(`Added more ticks (${response.pool.ticks.length}). Total ${allTicks.length}`)

        await this.sleep(100);
      } catch (error) {
        this.logger.error(`Failed to fetch ticks for pool ${id} with skip ${skip}`, error);
        throw error;
      }
    }

    return allTicks;
  }

  async findPoolByID(id: string, first: number = 1000, skip: number = 0): Promise<Pool | null> {
    try {
      const response = await this.graphqlClient.request<{ pool: Pool | null }>(
        UniswapService.POOL_QUERY,
        { id, first, skip },
      );

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

  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
