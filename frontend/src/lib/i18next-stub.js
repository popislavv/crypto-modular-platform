class I18nInstance {
  constructor() {
    this.language = 'en'
    this.fallbackLng = 'en'
    this.resources = {}
    this.listeners = { languageChanged: [] }
    this.initialized = false
  }

  use(plugin) {
    this.plugin = plugin
    return this
  }

  init(options = {}) {
    this.language = options.lng || this.language
    this.fallbackLng = options.fallbackLng || this.fallbackLng
    this.resources = options.resources || {}
    this.initialized = true
    if (this.plugin && typeof this.plugin.init === 'function') {
      this.plugin.init(this)
    }
    return this
  }

  changeLanguage(lng) {
    this.language = lng
    this.emit('languageChanged', lng)
    return Promise.resolve(lng)
  }

  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(cb)
  }

  off(event, cb) {
    if (!this.listeners[event]) return
    this.listeners[event] = this.listeners[event].filter((fn) => fn !== cb)
  }

  emit(event, payload) {
    ;(this.listeners[event] || []).forEach((fn) => fn(payload))
  }

  t(key, vars = {}) {
    const langRes = this.resources[this.language]?.translation || this.resources[this.fallbackLng]?.translation || {}
    const value = key.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), langRes)
    if (typeof value === 'string') {
      return value.replace(/{{(.*?)}}/g, (_, v) => (vars[v.trim()] ?? `{{${v.trim()}}}`))
    }
    return value || key
  }
}

const i18n = new I18nInstance()
export default i18n
