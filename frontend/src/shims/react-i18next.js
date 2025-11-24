import i18n from './i18next.js'

export const initReactI18next = {
  type: '3rdParty',
  init(instance) {
    i18n.instance = instance;
  },
};

export function useTranslation() {
  return { t: i18n.t.bind(i18n), i18n };
}

export function I18nextProvider({ children }) {
  return children;
}
