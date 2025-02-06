import { Test, TestingModule } from '@nestjs/testing';
import { UniswapService } from './uniswap.service';
import { GraphQLClient } from 'graphql-request';
import { ConfigService } from '@nestjs/config';
import { Pool } from './uniswap/schema/pool/pool.schema';
import { Tick } from './uniswap/schema/tick/tick.schema';

jest.mock('graphql-request');

const validPool = (id?: string, ticks: Tick[] = []) => {
  return {
    id: id,
    ticks: ticks,
    token0: { symbol: 'ETH', id: '0', name: "Ethereum" },
    token1: { symbol: 'USDT', id: '1', name: "Tether" },
    feeTier: 1000,
    sqrtPrice: 4,
    liquidity: 5,
  } as Pool
}

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

    jest.spyOn(service, 'sleep').mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });


  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return pool successfully', async () => {
    const pool = validPool(
      EXISTING_POOL_ID,
      [{ id: '0', tickIdx: 0, price0: 0.1, price1: 1 }],
    )

    mockGraphQLClient.request.mockResolvedValue({ pool });
    const result = await service.findPoolByID('0');
    expect(result).toEqual(pool);
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

  it('should fetch ticks in batches', async () => {
    const ticks: Tick[] = [
      { id: '1', tickIdx: 1, price0: 100, price1: 101 },
      { id: '2', tickIdx: 2, price0: 200, price1: 201 },
    ];
    const pool = validPool(EXISTING_POOL_ID, ticks)

    mockGraphQLClient.request.mockResolvedValueOnce({ pool });

    const result = await service.fetchTicksInBatches(EXISTING_POOL_ID, 2);

    expect(result).toEqual(ticks);
    expect(mockGraphQLClient.request).toHaveBeenCalledTimes(2);
  });

  it('should handle multiple batches', async () => {
    const ticksBatch1: Tick[] = [
      { id: '1', tickIdx: 1, price0: 100, price1: 101 },
      { id: '2', tickIdx: 2, price0: 200, price1: 201 },
    ];
    const ticksBatch2: Tick[] = [
      { id: '3', tickIdx: 3, price0: 300, price1: 301 },
      { id: '4', tickIdx: 4, price0: 400, price1: 401 },
    ];

    // pools here actually the same
    const pool1 = validPool(EXISTING_POOL_ID, ticksBatch1)
    const pool2 = validPool(EXISTING_POOL_ID, ticksBatch2)
    const pool3 = validPool(EXISTING_POOL_ID)

    mockGraphQLClient.request
      .mockResolvedValueOnce({ pool: pool1 })
      .mockResolvedValueOnce({ pool: pool2 })
      .mockResolvedValueOnce({ pool: pool3 });

    const result = await service.fetchTicksInBatches('pool1', 1);

    expect(result).toEqual([...ticksBatch1, ...ticksBatch2]);
    expect(mockGraphQLClient.request).toHaveBeenCalledTimes(3);
  });
});
