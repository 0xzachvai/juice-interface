import { parseEther } from '@ethersproject/units'
import { Descriptions } from 'antd'
import CurrencySymbol from 'components/shared/CurrencySymbol'
import { getBallotStrategyByAddress } from 'constants/ballot-strategies'
import { ProjectContext } from 'contexts/projectContext'
import { ThemeContext } from 'contexts/themeContext'
import { CurrencyOption } from 'models/currency-option'
import { FundingCycle } from 'models/funding-cycle'
import { useContext } from 'react'
import { formatDate } from 'utils/formatDate'
import { formatWad, fromPerbicent, fromPermille } from 'utils/formatNumber'
import {
  decodeFCMetadata,
  hasFundingTarget,
  isRecurring,
} from 'utils/fundingCycle'
import { weightedRate } from 'utils/math'

import TooltipLabel from '../shared/TooltipLabel'

export default function FundingCycleDetails({
  fundingCycle,
}: {
  fundingCycle: FundingCycle | undefined
}) {
  const {
    theme: { colors },
  } = useContext(ThemeContext)

  const { tokenSymbol } = useContext(ProjectContext)

  if (!fundingCycle) return null

  const formattedStartTime = formatDate(fundingCycle.start.mul(1000))

  const secondsInDay = 24 * 60 * 60

  const formattedEndTime = formatDate(
    fundingCycle.start.add(fundingCycle.duration.mul(secondsInDay)).mul(1000),
  )

  const metadata = decodeFCMetadata(fundingCycle.metadata)

  return (
    <div>
      <Descriptions
        labelStyle={{ fontWeight: 600 }}
        size="small"
        column={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 2 }}
      >
        {
          <Descriptions.Item label="Target">
            {hasFundingTarget(fundingCycle) ? (
              <>
                <CurrencySymbol
                  currency={fundingCycle.currency.toNumber() as CurrencyOption}
                />
                {formatWad(fundingCycle.target)}
              </>
            ) : (
              'No target'
            )}
          </Descriptions.Item>
        }

        <Descriptions.Item label="Duration">
          {fundingCycle.duration.gt(0)
            ? fundingCycle.duration.toString() + ' days'
            : 'Not set'}
        </Descriptions.Item>

        {fundingCycle.duration.gt(0) && (
          <Descriptions.Item label="Start">
            {formattedStartTime}
          </Descriptions.Item>
        )}

        {fundingCycle.duration.gt(0) && (
          <Descriptions.Item label="End">{formattedEndTime}</Descriptions.Item>
        )}

        {isRecurring(fundingCycle) && (
          <Descriptions.Item
            label={
              <TooltipLabel
                label="Discount rate"
                tip="The ratio of tokens rewarded per payment amount will decrease by this percentage with each new funding cycle. A higher discount rate will incentivize supporters to pay your project earlier than later."
              />
            }
          >
            {fromPermille(fundingCycle.discountRate)}%
          </Descriptions.Item>
        )}

        {isRecurring(fundingCycle) && (
          <Descriptions.Item
            span={2}
            label={
              <TooltipLabel
                label="Bonding curve"
                tip="This rate determines the amount of overflow that each token can be redeemed for at any given time. On a lower bonding curve, redeeming a token increases the value of each remaining token, creating an incentive to hodl tokens longer than others. A bonding curve of 100% means all tokens will have equal value regardless of when they are redeemed."
              />
            }
          >
            {fromPerbicent(metadata?.bondingCurveRate)}%
          </Descriptions.Item>
        )}

        <Descriptions.Item
          label={
            <TooltipLabel
              label={`Reserved ${tokenSymbol ?? 'tokens'}`}
              tip='Whenever someone pays your project, this percentage of tokens will be reserved and the rest will go to the payer. Reserve tokens are reserved for the project owner by default, but can also be allocated to other wallet addresses by the owner. Once tokens are reserved, anyone can "mint" them, which distributes them to their intended receivers.'
            />
          }
        >
          {fromPerbicent(metadata?.reservedRate)}%
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <TooltipLabel
              label="Issue rate"
              tip={`${
                tokenSymbol ?? 'Tokens'
              } received per ETH paid to the treasury. This can change over time according to the discount rate and reserved tokens amount of future funding cycles.`}
            />
          }
          span={2}
        >
          {formatWad(weightedRate(fundingCycle, parseEther('1'), 'payer'), {
            decimals: 0,
          })}{' '}
          {metadata?.reservedRate
            ? `(+${formatWad(
                weightedRate(fundingCycle, parseEther('1'), 'reserved'),
                {
                  decimals: 0,
                },
              )} reserved)`
            : ''}{' '}
          {tokenSymbol ?? 'tokens'}/ETH
        </Descriptions.Item>

        {/* <Descriptions.Item
          span={2}
          label={
            <TooltipLabel
              label="Burn rate"
              tip={`The amount of ${
                tokenSymbol ? tokenSymbol + ' token' : 'token'
              } that must be burned in exchange for one ETH of overflow. This can change over time according to the bonding curve of future funding cycles.`}
            />
          }
        >
          {redeemRate ? formattedNum(parseWad(1).div(redeemRate)) : '--'}{' '}
          {tokenSymbol ?? 'tokens'}/ETH
        </Descriptions.Item> */}
      </Descriptions>

      <div>
        <span style={{ fontWeight: 600, color: colors.text.secondary }}>
          <TooltipLabel
            label="Reconfiguration strategy"
            tip="Rules for determining how funding cycles can be reconfigured."
          />
          :
        </span>{' '}
        {getBallotStrategyByAddress(fundingCycle.ballot).name}
        <div style={{ color: colors.text.secondary }}>
          <div style={{ fontSize: '0.7rem' }}>
            Address: {getBallotStrategyByAddress(fundingCycle.ballot).address}
            <br />
            {getBallotStrategyByAddress(fundingCycle.ballot).description}
          </div>
        </div>
      </div>
    </div>
  )
}
