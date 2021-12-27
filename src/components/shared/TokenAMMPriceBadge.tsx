import { LoadingOutlined } from '@ant-design/icons'
import { useContext } from 'react'
import { ThemeContext } from 'contexts/themeContext'
import { useUniswapPriceQuery } from 'hooks/ERC20UniswapPrice'
import { formattedNum } from 'utils/formatNumber'
import UniswapLogo from 'components/icons/Uniswap'

type exchangeName = 'uniswap'

const LOGOS = {
  uniswap: UniswapLogo,
}

type Props = {
  exchangeName: exchangeName
  tokenSymbol: string
  tokenAddress: string
}

export default function TokenAMMPriceBadge({
  exchangeName,
  tokenSymbol,
  tokenAddress,
}: Props) {
  const {
    theme: { colors },
  } = useContext(ThemeContext)

  const { data: priceData, isLoading } = useUniswapPriceQuery({
    tokenSymbol,
    tokenAddress,
  })

  const { WETHPrice } = priceData || {}
  const Logo = LOGOS[exchangeName]
  const uniswapUrl = `https://app.uniswap.org/#/swap?&inputCurrency=${tokenAddress}&outputCurrency=ETH`

  return (
    <a
      className="quiet"
      href={uniswapUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span
        style={{
          padding: '0 0.5rem',
          borderRadius: 100,
          border: `1px solid ${colors.stroke.secondary}`,
          fontSize: '0.7rem',
          display: 'inline-flex',
          alignItems: 'center',
          filter: !isLoading && !WETHPrice ? 'grayscale(100%)' : undefined,
        }}
      >
        <span style={{ marginRight: '0.25rem' }}>
          <Logo size={20} />
        </span>
        {isLoading && <LoadingOutlined />}

        {!isLoading &&
          WETHPrice &&
          `${formattedNum(WETHPrice.toFixed(0))} ${tokenSymbol}/ETH`}
      </span>
    </a>
  )
}
