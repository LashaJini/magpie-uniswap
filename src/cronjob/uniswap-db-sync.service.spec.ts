import { Logger } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Pool } from "../graph/uniswap/schema/pool/pool.schema";
import { DatabaseService } from "../storage/database/database.service";
import { UniswapDbSyncService } from "./uniswap-db-sync.service";
import { UniswapEthersService } from "../graph/uniswap-ethers/uniswap-ethers.service";

describe('UniswapDbSyncService', () => {
  let service: UniswapDbSyncService;
  let uniswapService: UniswapEthersService;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniswapDbSyncService,
        {
          provide: UniswapEthersService,
          useValue: {
            findPoolByID: jest.fn(),
            fetchTicksInBatches: jest.fn(),
            calculateTickIndices: jest.fn(),
            getAllTicks: jest.fn(),
          },
        },
        {
          provide: DatabaseService,
          useValue: {
            insertPoolWithTicksAndTokens: jest.fn(),
          },
        },
        Logger,
      ],
    }).compile();

    service = module.get(UniswapDbSyncService);
    uniswapService = module.get(UniswapEthersService);
    databaseService = module.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call insertPoolWithTicksAndTokens when pool is found', async () => {
    const pool = new Pool();
    jest.spyOn(uniswapService, 'findPoolByID').mockResolvedValue(pool);
    const insertPoolWithTicksAndTokensSpy = jest.spyOn(databaseService, 'insertPoolWithTicksAndTokens').mockResolvedValue();

    await service.handleCron();

    expect(insertPoolWithTicksAndTokensSpy).toHaveBeenCalledWith(pool);
  });

  it('should not call insertPoolWithTicksAndTokens when pool is not found', async () => {
    jest.spyOn(uniswapService, 'findPoolByID').mockResolvedValue(null);
    const insertPoolWithTicksAndTokensSpy = jest.spyOn(databaseService, 'insertPoolWithTicksAndTokens').mockResolvedValue();

    await service.handleCron();

    expect(insertPoolWithTicksAndTokensSpy).not.toHaveBeenCalled();
  });
});
