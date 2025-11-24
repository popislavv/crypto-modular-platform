class I18n {
  constructor() {
    this.language = 'en';
    this.fallbackLng = 'en';
    this.resources = {};
  }

  use(plugin) {
    this.plugin = plugin;
    return this;
  }

  init(options = {}) {
    this.resources = options.resources || {};
    this.language = options.lng || options.fallbackLng || 'en';
    this.fallbackLng = options.fallbackLng || 'en';
    if (this.plugin && typeof this.plugin.init === 'function') {
      this.plugin.init(this);
    }
    return this;
  }

  changeLanguage(lng) {
    this.language = lng;
    return Promise.resolve(this);
  }

  _resolve(lng, key) {
    const parts = key.split('.');
    let current = this.resources?.[lng]?.translation;
    for (const part of parts) {
      if (current && Object.prototype.hasOwnProperty.call(current, part)) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return current;
  }

  t(key, opts = {}) {
    const value =
      this._resolve(this.language, key) ?? this._resolve(this.fallbackLng, key) ?? key;
    if (typeof value !== 'string') return key;
    return value.replace(/{{(.*?)}}/g, (_, k) => {
      const trimmed = k.trim();
      return opts[trimmed] !== undefined ? opts[trimmed] : '';
    });
  }
}

const i18n = new I18n();
export default i18n;
