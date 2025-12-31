// components/CountryFlag.tsx
import Flag from 'react-world-flags'

const CountryFlag = ({ countryCode, size = 24 }: { countryCode?: string; size?: number }) => {
  if (!countryCode) return null

  return (
    <Flag
      code={countryCode.toUpperCase()}
      style={{
        width: size,
        height: size,
        borderRadius: 3,
        objectFit: 'cover',
        marginLeft: 6
      }}
    />
  )
}

export default CountryFlag
