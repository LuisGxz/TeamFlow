import { Injectable, signal } from '@angular/core';
import { Lang, TRANSLATIONS } from './translations';

const STORAGE_KEY = 'tf-lang';

/** Signal-based EN/ES translation. Shares the portfolio-wide `portfolio-lang` key when present. */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _lang = signal<Lang>(this.read());
  readonly lang = this._lang.asReadonly();

  setLang(lang: Lang): void {
    this._lang.set(lang);
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }

  toggle(): void {
    this.setLang(this._lang() === 'en' ? 'es' : 'en');
  }

  /** Translate a key for the active language; falls back to the key itself if missing. */
  t(key: string): string {
    const entry = TRANSLATIONS[key];
    if (!entry) return key;
    return entry[this._lang()];
  }

  private read(): Lang {
    try {
      const saved = (localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('portfolio-lang')) as Lang | null;
      return saved === 'es' ? 'es' : 'en';
    } catch {
      return 'en';
    }
  }
}
