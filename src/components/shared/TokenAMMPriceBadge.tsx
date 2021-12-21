import { useContext } from 'react'
import { ThemeContext } from 'contexts/themeContext'

type exchangeName = 'uniswap'

type Props = {
  exchangeName: exchangeName
}

export default function TokenAMMPriceBadge({ exchangeName }: Props) {
  const {
    theme: { colors },
  } = useContext(ThemeContext)

  const price = '420,690 JBX/ETH'

  return (
    <span
      style={{
        padding: '0.25rem',
        borderRadius: 100,
        border: `1px solid ${colors.stroke.tertiary}`,
        fontSize: '0.7rem',
      }}
    >
      {price}
    </span>
  )
}
