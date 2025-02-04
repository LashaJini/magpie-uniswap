import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from './uniswap/schema/pool/pool.schema';
import { gql } from 'graphql-request';
import axios, { AxiosResponse } from 'axios';

@Injectable()
export class UniswapService {
  private apiURL: string;

  constructor(private readonly configService: ConfigService) {
    this.apiURL = this.configService.getOrThrow("UNISWAP_ENDPOINT")
  }

  async findPoolByID(id: string): Promise<Pool> {
    const query = gql`
      query ($id: String) {
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
        }
      }
    `

    const variables = { id }

    try {
      const response: AxiosResponse = await axios.post(
        this.apiURL,
        { query, variables },
      );

      return response.data?.data?.pool;
    } catch (error) {
      console.log("oops", error)
      throw error;
    }
  }
}
