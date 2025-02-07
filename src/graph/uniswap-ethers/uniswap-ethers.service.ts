import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import { BigNumber, ethers } from 'ethers';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { Pool } from '../uniswap/schema/pool/pool.schema';
import { Tick } from '../uniswap/schema/tick/tick.schema';

@Injectable()
export class UniswapEthersService {
  private readonly logger = new CustomLogger(UniswapEthersService.name);
  private readonly provider: ethers.providers.JsonRpcProvider;
  private readonly poolContract: ethers.Contract;
  private apiUrl: string;
  private poolAddress: string;

  private static readonly UNISWAP_V3_POOL_ABI = IUniswapV3PoolABI.abi

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.getOrThrow("MAINNET_ENDPOINT")
    this.provider = new ethers.providers.JsonRpcProvider(this.apiUrl);

    this.poolAddress = this.configService.getOrThrow("UNISWAP_POOL_ADDRESS")
    this.poolContract = new ethers.Contract(
      this.poolAddress,
      UniswapEthersService.UNISWAP_V3_POOL_ABI,
      this.provider
    );
  }

  // https://docs.uniswap.org/sdk/v3/guides/advanced/pool-data#calculating-all-bitmap-positions
  tickToWord(tick: number, tickSpacing: number): number {
    let compressed = Math.floor(tick / tickSpacing)
    if (tick < 0 && tick % tickSpacing !== 0) {
      compressed -= 1
    }
    return tick >> 8
  }

  async calculateTickIndices() {
    const tickSpacing = Number(await this.poolContract.tickSpacing());
    const tickIndices: number[] = []

    // const minWord = this.tickToWord(-887272, tickSpacing)
    // const maxWord = this.tickToWord(887272, tickSpacing)
    const minWord = -100
    const maxWord = 100

    let calls: any[] = []
    let wordPosIndices: number[] = []
    for (let i = minWord; i <= maxWord; i++) {
      wordPosIndices.push(i)
      calls.push(this.fetchWithRetry(i))
    }

    const results = await Promise.all(calls);

    for (let j = 0; j < wordPosIndices.length; j++) {
      const ind = wordPosIndices[j]
      const bitmap = BigInt(results[j])

      if (bitmap !== 0n) {
        for (let i = 0; i < 256; i++) {
          const bit = 1n
          const initialized = (bitmap & (bit << BigInt(i))) !== 0n
          if (initialized) {
            const tickIndex = (ind * 256 + i) * tickSpacing
            tickIndices.push(tickIndex)
          }
        }
      }
    }

    return tickIndices
  }

  async getAllTicks(
    tickIndices: number[]
  ): Promise<Tick[]> {
    const calls: any[] = []

    for (const index of tickIndices) {
      calls.push(this.poolContract.ticks(index))
    }

    // const results = await multicallProvider.all(calls)
    const allTicks: Tick[] = []

    for (let i = 0; i < tickIndices.length; i++) {
      const index = tickIndices[i]
      // const ethersResponse = results[i]
      const tick = {
        id: `${this.poolAddress}#${index}`,
        tickIdx: index,
        price0: 0, // TODO: price calculation is based on algorithm
        price1: 1, // TODO: price calculation is based on algorithm
      }
      allTicks.push(tick)
    }
    return allTicks
  }

  // https://docs.alchemy.com/reference/throughput#option-4-exponential-backoff
  async fetchWithRetry(
    wordPos: number,
    maxRetries: number = 5,
    maxBackoff: number = 32 * 1000 // 32 seconds max wait time
  ): Promise<BigInt> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await this.poolContract.tickBitmap(wordPos);
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          this.logger.warn(`Failed to fetch tickBitmap(${wordPos}) after ${maxRetries} retries: ${error}`);
          return 0n
        }

        const backoffTime = Math.min((2 ** (attempt - 1)) * 1000 + Math.random() * 1000, maxBackoff);
        this.logger.warn(`Retry ${attempt} for tickBitmap(${wordPos}) in ${backoffTime.toFixed(0)} ms...`);
        await this.sleep(backoffTime);
      }
    }
    throw new Error(`Unreachable code in fetchWithRetry for wordPos ${wordPos}`);
  }

  async findPoolByID(id: string = this.poolAddress): Promise<Pool | null> {
    try {
      const token0Address: string = await this.poolContract.token0();
      const token1Address: string = await this.poolContract.token1();
      const feeTier = await this.poolContract.fee();
      const liquidity = await this.poolContract.liquidity();
      const slot0 = await this.poolContract.slot0();

      return {
        token0: {
          id: token0Address.toLowerCase(),
          ...await this.getTokenSymbolAndName(token0Address),
        },
        token1: {
          id: token1Address.toLowerCase(),
          ...await this.getTokenSymbolAndName(token1Address),
        },
        feeTier,
        liquidity: Number(BigNumber.from(liquidity).toBigInt()),
        sqrtPrice: Number(BigNumber.from(slot0.sqrtPriceX96).toBigInt()),
        ticks: [],
        id,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch pool data with ID: ${id}`, error);
      throw error;
    }
  }

  // Helper function to fetch token symbol from contract
  // https://ethereum.org/en/developers/docs/standards/tokens/erc-20/#methods
  async getTokenSymbolAndName(tokenAddress: string): Promise<{ name: string, symbol: string }> {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        "function symbol() external view returns (string)",
        "function name() external view returns (string)",
      ],
      this.provider
    );
    return { symbol: await tokenContract.symbol(), name: await tokenContract.name() };
  }

  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

