import { UniswapService } from "../graph/uniswap.service";
import { UniswapDbSyncService } from "./uniswap-db-sync.service";
import { DatabaseService } from "../storage/database/database.service";
import { Test, TestingModule } from "@nestjs/testing";
import { Logger } from "@nestjs/common";
import { Pool } from "../graph/uniswap/schema/pool/pool.schema";

describe('UniswapDbSyncService', () => {
  let service: UniswapDbSyncService;
  let uniswapService: UniswapService;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniswapDbSyncService,
        {
          provide: UniswapService,
          useValue: {
            findPoolByID: jest.fn(),
            fetchTicksInBatches: jest.fn(),
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
    uniswapService = module.get(UniswapService);
    databaseService = module.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call findPoolByID with the correct ID', async () => {
    const poolId = "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8";
    const findPoolByIDSpy = jest.spyOn(uniswapService, 'findPoolByID').mockResolvedValue(null);

    await service.handleCron();

    expect(findPoolByIDSpy).toHaveBeenCalledWith(poolId);
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
