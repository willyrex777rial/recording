import React, { useState, useEffect } from 'react';
import { Moon, Sun, Mic } from 'lucide-react';

const Header = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-background border-b border-border px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-2">
        <Mic className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">VoiceLog Pro</h1>
      </div>
      <button
        onClick={toggleTheme}
        className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
        aria-label="Toggle Dark Mode"
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    </header>
  );
};

export default Header;
