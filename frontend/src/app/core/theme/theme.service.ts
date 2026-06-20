import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'tf-theme';

/** Light/dark theme with persistence. The initial class is applied pre-paint by an inline script in index.html. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<Theme>(this.read());
  readonly theme = this._theme.asReadonly();

  constructor() {
    this.apply(this._theme());
  }

  toggle(): void {
    this.set(this._theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this._theme.set(theme);
    this.apply(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable — keep in memory only */
    }
  }

  private apply(theme: Theme): void {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    root.classList.toggle('dark', theme === 'dark');
    // Drop the transition helper shortly after so it doesn't fight rapid UI updates.
    window.setTimeout(() => root.classList.remove('theme-transition'), 250);
  }

  private read(): Theme {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }
}
