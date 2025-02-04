import { Test, TestingModule } from '@nestjs/testing';
import { UniswapService } from './uniswap.service';
import { GraphQLClient } from 'graphql-request';
import { ConfigService } from '@nestjs/config';
import { Pool } from './uniswap/schema/pool/pool.schema';

jest.mock('graphql-request');

describe('UniswapService', () => {
  const EXISTING_POOL_ID = '0';
  let service: UniswapService;
  let mockGraphQLClient: jest.Mocked<GraphQLClient>;

  beforeEach(async () => {
    const mockConfigService = {
      getOrThrow: jest.fn().mockReturnValue('doesnotmatter'),
    }

    mockGraphQLClient = new GraphQLClient('') as jest.Mocked<GraphQLClient>;
    (GraphQLClient as jest.Mock).mockImplementation(() => mockGraphQLClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniswapService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(UniswapService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return pool successfully', async () => {
    const mockPool: Pool = {
      id: EXISTING_POOL_ID,
      ticks: [
        { id: '0', tickIdx: 0, price0: 0.1, price1: 1 },
      ],
      token0: { symbol: 'ETH', id: '0', name: "Ethereum" },
      token1: { symbol: 'USDT', id: '1', name: "Tether" },
      feeTier: 1000,
      sqrtPrice: 4,
      liquidity: 5,
    }

    mockGraphQLClient.request.mockResolvedValue({ pool: mockPool });
    const result = await service.findPoolByID('0');
    expect(result).toEqual(mockPool);
  });

  it('should return null when no pool is found', async () => {
    mockGraphQLClient.request.mockResolvedValue({ pool: null });
    const result = await service.findPoolByID('nonexisting');
    expect(result).toBeNull();
  });

  it('should throw error when request fails', async () => {
    mockGraphQLClient.request.mockRejectedValue(new Error('some error'));
    await expect(service.findPoolByID(EXISTING_POOL_ID)).rejects.toThrow('some error')
  });
});
