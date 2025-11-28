import { createContext, useContext, useEffect, useState } from 'react'
import i18n from './i18next-stub'

const I18nContext = createContext({ i18n, t: i18n.t.bind(i18n) })

export const initReactI18next = {
  type: '3rdParty',
  init(instance) {
    instance.__initialized = true
  },
}

export function I18nextProvider({ i18n: passed, children }) {
  const inst = passed || i18n
  const [lng, setLng] = useState(inst.language)

  useEffect(() => {
    const handler = (language) => setLng(language)
    inst.on('languageChanged', handler)
    return () => inst.off('languageChanged', handler)
  }, [inst])

  const value = { i18n: inst, t: inst.t.bind(inst), language: lng }
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  return { t: ctx.t, i18n: ctx.i18n }
}
