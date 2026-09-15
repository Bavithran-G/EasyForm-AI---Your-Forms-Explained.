import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeSwitchProps {
  className?: string;
  variant?: 'floating' | 'navbar';
}

export const ThemeSwitch: React.FC<ThemeSwitchProps> = ({
  className = '',
  variant = 'floating',
}) => {
  const { theme, setTheme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'navbar') {
    return (
      <button
        onClick={toggleTheme}
        className={`relative p-2 rounded-xl border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2EB688] ${
          isDark
            ? 'bg-[#2E2E2E] border-[rgba(206,241,228,0.15)] text-[#2EB688] hover:border-[#2EB688]/80 shadow-[0_0_12px_rgba(46,182,136,0.15)]'
            : 'bg-[#CCF0E6]/50 border-[#CEF1E4] text-[#2E2E2E] hover:border-[#2EB688] shadow-sm'
        } ${className}`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <div className="relative w-4 h-4">
          <Sun
            className={`w-4 h-4 absolute inset-0 transition-all duration-500 transform ${
              isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100 text-[#2EB688]'
            }`}
          />
          <Moon
            className={`w-4 h-4 absolute inset-0 transition-all duration-500 transform ${
              isDark ? 'rotate-0 scale-100 opacity-100 text-[#2EB688]' : '-rotate-90 scale-0 opacity-0'
            }`}
          />
        </div>
      </button>
    );
  }

  // Floating Corner Segmented Switch (Fixed in bottom-right corner, fully functional)
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${className}`}
      role="region"
      aria-label="Theme selector"
    >
      <div className="flex items-center p-1 rounded-full bg-white/95 dark:bg-[#2E2E2E]/95 border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-colors">
        {/* Light Option */}
        <button
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all duration-300 focus:outline-none ${
            !isDark
              ? 'bg-[#CCF0E6] text-[#2E2E2E] font-bold shadow-sm border border-[#CEF1E4]'
              : 'text-[#6B706D] dark:text-[#ACAFAB] hover:text-[#2E2E2E] dark:hover:text-white'
          }`}
          aria-pressed={!isDark}
          title="Switch to Light Theme"
        >
          <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-[#2EB688]' : 'opacity-70'}`} />
          <span>Light</span>
        </button>

        {/* Dark Option */}
        <button
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all duration-300 focus:outline-none ${
            isDark
              ? 'bg-[#111214] text-[#CEF1E4] font-bold shadow-sm border border-[#2EB688]/50 shadow-[0_0_12px_rgba(46,182,136,0.25)]'
              : 'text-[#6B706D] dark:text-[#ACAFAB] hover:text-[#2E2E2E] dark:hover:text-white'
          }`}
          aria-pressed={isDark}
          title="Switch to Dark Theme"
        >
          <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-[#2EB688]' : 'opacity-70'}`} />
          <span>Dark</span>
        </button>
      </div>
    </div>
  );
};
