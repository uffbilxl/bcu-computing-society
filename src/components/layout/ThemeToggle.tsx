'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export const THEME_STORAGE_KEY = 'sca-theme'

/* Inline, blocking script string — injected in <head> so the theme is set
   before first paint (no flash of the wrong theme). Dark is the default;
   we only ever need to explicitly opt into light. */
export const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var wantsLight = stored ? stored === 'light' : matchMedia('(prefers-color-scheme: light)').matches;
    if (wantsLight) document.documentElement.setAttribute('data-theme', 'light');
  } catch (e) {}
})();
`

export function ThemeToggle({ className, iconSize = 15 }: { className?: string; iconSize?: number }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark')
  }, [])

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    try { localStorage.setItem(THEME_STORAGE_KEY, next) } catch { /* storage blocked */ }
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      className={className}
    >
      {/* Keyed so the icon re-mounts and spins in on every switch */}
      <span key={theme} className="theme-icon inline-flex">
        {theme === 'light' ? <Moon size={iconSize} aria-hidden="true" /> : <Sun size={iconSize} aria-hidden="true" />}
      </span>
    </button>
  )
}
