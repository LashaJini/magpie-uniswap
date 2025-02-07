import { Module } from '@nestjs/common';
import { UniswapEthersService } from './uniswap-ethers.service';

@Module({
  providers: [UniswapEthersService],
  exports: [UniswapEthersService],
})
export class UniswapEthersModule { }
