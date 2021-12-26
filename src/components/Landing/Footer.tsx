import { ThemeContext } from 'contexts/themeContext'
import { useContext } from 'react'
import { CSSProperties } from 'react'

import { Languages } from 'constants/languages/language-options'

export default function Footer() {
  const { colors } = useContext(ThemeContext).theme

  const footerLinksStyles: CSSProperties = {
    display: 'inline-flex',
    justifyContent: 'center',
  }

  const link = (text: string, link?: string) => (
    <a
      style={{
        color: colors.text.action.primary,
        marginLeft: 10,
        marginRight: 10,
      }}
      href={link}
    >
      {text}
    </a>
  )

  // Renders language links
  const languageLink = (lang: string) => (
    <div onClick={() => setLanguage(lang)}>{link(Languages[lang].long)}</div>
  )

  // Sets the new language with localStorage and reloads the page
  function setLanguage(newLanguage: string) {
    localStorage.setItem('lang', newLanguage)
    window.location.reload()
  }

  return (
    <div
      style={{
        display: 'grid',
        rowGap: 20,
        padding: 30,
        background: 'black',
        textAlign: 'center',
      }}
    >
      <div style={footerLinksStyles}>
        {Object.keys(Languages).map(languageLink)}
      </div>
      <div style={footerLinksStyles}>
        {link('Discord', 'https://discord.gg/6jXrJSyDFf')}
        {link('GitHub', 'https://github.com/jbx-protocol/juice-interface')}
        {link('Twitter', 'https://twitter.com/juiceboxETH')}
      </div>
    </div>
  )
}
