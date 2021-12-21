import { Pool } from '@uniswap/v3-sdk'
import { Token } from '@uniswap/sdk-core'
import { useQuery } from 'react-query'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'

import { readProvider } from 'constants/readProvider'

interface Immutables {
  factory: string
  token0: string
  token1: string
  fee: number
  tickSpacing: number
  maxLiquidityPerTick: BigNumber
}

interface State {
  liquidity: BigNumber
  sqrtPriceX96: BigNumber
  tick: number
  observationIndex: number
  observationCardinality: number
  observationCardinalityNext: number
  feeProtocol: number
  unlocked: boolean
}

export function useTokenAMMPriceQuery() {
  // TODO pass as prop, possibly also contract addr
  const projectTokenSymbol = 'JBX'
  const projectTokenName = 'Juicebox'
  // TODO probably search for pool address?
  const poolAddress = '0x48598Ff1Cee7b4d31f8f9050C2bbAE98e17E6b17' // pool address for JBX/ETH

  const poolContract = new Contract(
    poolAddress,
    IUniswapV3PoolABI,
    readProvider,
  )

  async function getPoolImmutables() {
    const immutables: Immutables = {
      factory: await poolContract.factory(),
      token0: await poolContract.token0(),
      token1: await poolContract.token1(),
      fee: await poolContract.fee(),
      tickSpacing: await poolContract.tickSpacing(),
      maxLiquidityPerTick: await poolContract.maxLiquidityPerTick(),
    }
    return immutables
  }

  async function getPoolState() {
    const slot = await poolContract.slot0()
    const PoolState: State = {
      liquidity: await poolContract.liquidity(),
      sqrtPriceX96: slot[0],
      tick: slot[1],
      observationIndex: slot[2],
      observationCardinality: slot[3],
      observationCardinalityNext: slot[4],
      feeProtocol: slot[5],
      unlocked: slot[6],
    }
    return PoolState
  }

  return useQuery(
    ['token-amm-price'],
    async () => {
      const immutables = await getPoolImmutables()
      const state = await getPoolState()
      const PROJECT_TOKEN = new Token(
        1,
        immutables.token0,
        18,
        projectTokenSymbol,
        projectTokenName,
      )
      const ETH = new Token(1, immutables.token1, 18, 'ETH', 'Ether')

      const projectTokenETHPool = new Pool(
        PROJECT_TOKEN,
        ETH,
        immutables.fee,
        state.sqrtPriceX96.toString(),
        state.liquidity.toString(),
        state.tick,
      )

      const projectTokenPrice = projectTokenETHPool.token0Price
      const ETHPrice = projectTokenETHPool.token1Price

      return {
        projectTokenSymbol,
        projectTokenPrice,
        ETHPrice,
      }
    },
    {
      refetchInterval: 30000,
      staleTime: 30000,
    },
  )
}
