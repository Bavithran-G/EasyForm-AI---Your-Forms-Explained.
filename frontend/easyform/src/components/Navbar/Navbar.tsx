import React, { useState, useEffect } from 'react';
import { FileText, ArrowRight, Menu, X } from 'lucide-react';
import { ThemeSwitch } from '../ui/ThemeSwitch';

interface NavbarProps {
  onOpenWorkspace: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenWorkspace }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('home');

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'workspace', label: 'Workspace' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'clarity', label: 'Designed for Clarity' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);

      // Active section scroll spy
      const sections = ['home', 'workspace', 'how-it-works', 'clarity'];
      const scrollPos = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveSection('home');
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  const handleTryEasyForm = () => {
    setMobileMenuOpen(false);
    if (onOpenWorkspace) {
      onOpenWorkspace();
    } else {
      scrollToSection('workspace');
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'py-3 bg-white/90 dark:bg-[#111214]/85 backdrop-blur-md border-b border-[#CEF1E4] dark:border-[rgba(206,241,228,0.12)] shadow-md dark:shadow-2xl dark:shadow-black/40'
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Logo & Wordmark */}
        <button
          onClick={() => scrollToSection('home')}
          className="flex items-center gap-2.5 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2EB688] rounded-lg p-1"
          aria-label="Easy Form Home"
        >
          <div className="w-9 h-9 rounded-md bg-[#CCF0E6]/50 dark:bg-[#2E2E2E] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] flex items-center justify-center text-[#2EB688] group-hover:border-[#2EB688] group-hover:shadow-[0_0_15px_rgba(46,182,136,0.3)] transition-all duration-300">
            <FileText className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-sm tracking-[0.2em] uppercase font-bold text-[#2E2E2E] dark:text-white group-hover:text-[#2EB688] transition-colors">
              EASY FORM
            </span>
            <span className="text-[10px] tracking-widest text-[#6B706D] dark:text-[#ACAFAB] uppercase font-mono">
              AI DOC ASSISTANT
            </span>
          </div>
        </button>

        {/* Center: Desktop Navigation Links matching exact page flow */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`relative py-1 text-sm transition-colors focus:outline-none ${
                  isActive
                    ? 'text-[#2EB688] font-semibold'
                    : 'text-[#6B706D] dark:text-[#ACAFAB] hover:text-[#2EB688] dark:hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {/* Subtle active accent indicator underline */}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#2EB688] transition-all duration-300" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Theme Switch & Primary CTA */}
        <div className="hidden md:flex items-center gap-3">
          {/* Functional Dark/Light Switch */}
          <ThemeSwitch variant="navbar" />

          <button
            onClick={handleTryEasyForm}
            id="nav-try-easyform"
            className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[#2EB688] hover:bg-[#259B73] transition-all duration-300 shadow-[0_4px_20px_rgba(46,182,136,0.35)] hover:shadow-[0_6px_28px_rgba(46,182,136,0.55)] hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2EB688]"
          >
            <span>Try Easy Form</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Mobile: Switch & Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeSwitch variant="navbar" />

          <button
            onClick={handleTryEasyForm}
            className="px-3 py-1.5 text-xs font-semibold rounded-full bg-[#2EB688] text-white flex items-center gap-1 shadow-sm"
          >
            <span>Try App</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white dark:bg-[#2E2E2E] border border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] text-[#2E2E2E] dark:text-white hover:text-[#2EB688] focus:outline-none"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Animated Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-3 pb-6 bg-white dark:bg-[#1E2220] border-b border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)] shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-3 duration-300">
          <nav className="flex flex-col gap-2 text-base font-medium">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`py-2 px-3 text-left rounded-xl transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-[#CCF0E6]/50 dark:bg-[#2E2E2E] text-[#2EB688] font-bold'
                      : 'text-[#6B706D] dark:text-[#ACAFAB] hover:bg-[#F0FAF6] dark:hover:bg-[#252A28] hover:text-[#2E2E2E] dark:hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-[#2EB688]" />
                  )}
                </button>
              );
            })}
            <div className="pt-2 mt-2 border-t border-[#CEF1E4] dark:border-[rgba(206,241,228,0.15)]">
              <button
                onClick={handleTryEasyForm}
                className="w-full py-3 rounded-xl font-semibold text-center text-white bg-[#2EB688] hover:bg-[#259B73] shadow-md flex items-center justify-center gap-2"
              >
                <span>Try Easy Form</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
