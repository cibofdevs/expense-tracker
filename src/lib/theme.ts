export function setTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  
  // Add transition class before changing theme
  root.classList.add('transition-colors', 'duration-300');
  
  const applyTheme = (isDark: boolean) => {
    root.classList.toggle('dark', isDark);
  };

  if (theme === 'system') {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(mediaQuery.matches);

    // Listen for system theme changes
    mediaQuery.addEventListener('change', (e) => applyTheme(e.matches));
  } else {
    applyTheme(theme === 'dark');
  }
  
  localStorage.setItem('theme', theme);

  // Remove transition class after animation completes
  setTimeout(() => {
    root.classList.remove('transition-colors', 'duration-300');
  }, 300);
}