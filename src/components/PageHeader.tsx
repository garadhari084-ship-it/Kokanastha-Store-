import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Palette, ChevronDown } from 'lucide-react';

export type ColorTheme = 'midnight-gold' | 'emerald-pro' | 'royal-sapphire' | 'titanium-dark';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badgeText?: string;
  badgeActive?: boolean;
  rightContent?: React.ReactNode;
  children?: React.ReactNode;
  bottomContent?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  badgeText,
  badgeActive = true,
  rightContent,
  children,
  bottomContent
}) => {
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>('midnight-gold');
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsThemeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const themeStyles = useMemo(() => {
    switch (selectedTheme) {
      case 'emerald-pro':
        return {
          banner: 'from-emerald-950 via-slate-900 to-teal-950 text-white border-emerald-500/30',
          accentText: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      case 'royal-sapphire':
        return {
          banner: 'from-slate-950 via-sky-950 to-indigo-950 text-white border-sky-500/30',
          accentText: 'text-sky-400',
          badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        };
      case 'titanium-dark':
        return {
          banner: 'from-slate-900 via-slate-800 to-slate-950 text-white border-slate-600/30',
          accentText: 'text-slate-300',
          badge: 'bg-slate-700/50 text-slate-200 border-slate-500/30',
        };
      case 'midnight-gold':
      default:
        return {
          banner: 'from-slate-950 via-amber-950/40 to-slate-900 text-white border-amber-500/30',
          accentText: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
    }
  }, [selectedTheme]);

  return (
    <div className={`relative rounded-none p-3 sm:px-4 sm:py-3 bg-gradient-to-r ${themeStyles.banner} border shadow-2xl transition-all duration-300 mb-4 w-full`}>
      {badgeText && (
        <div className="absolute -top-1.5 sm:top-0 right-0 z-20">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 md:px-3.5 md:py-1.5 rounded-none rounded-bl-2xl border-l border-b text-[9px] sm:text-[10px] md:text-[11px] font-bold backdrop-blur-md ${themeStyles.badge}`}>
            {badgeActive && <span className="w-1.5 h-1.5 md:w-1.5 md:h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
            {badgeText}
          </span>
        </div>
      )}
      
      {/* Glow ambient spots */}
      <div className="absolute inset-0 overflow-hidden rounded-none pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col gap-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between w-full gap-2 sm:min-h-[4.5rem]">
          <div className={`flex-1 min-w-0 self-start text-left ${badgeText ? 'pr-28 sm:pr-36' : ''}`}>
            <div className="flex items-center gap-3 mb-0.5 flex-wrap sm:justify-start">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                <Icon className={themeStyles.accentText} />
                <span>{title}</span>
              </h1>
            </div>
            <p className="text-[10px] sm:text-xs font-medium text-slate-300 max-w-2xl">
              {subtitle}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-wrap shrink-0 relative z-30 self-end mt-3 sm:mt-0">
            {/* Color Theme Selector */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button 
                onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                className="p-2 md:px-3.5 md:py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-slate-200 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-[36px]"
              >
                <Palette size={15} className="text-amber-400" />
                <span className="capitalize hidden md:inline-block">{selectedTheme.replace('-', ' ')}</span>
                <ChevronDown size={14} className="hidden md:inline-block" />
              </button>
              
              {isThemeDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50">
                  <button onClick={() => { setSelectedTheme('midnight-gold'); setIsThemeDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-[11px] text-amber-300 hover:bg-slate-800 rounded-xl font-medium flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span> Midnight Gold
                  </button>
                  <button onClick={() => { setSelectedTheme('emerald-pro'); setIsThemeDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-[11px] text-emerald-300 hover:bg-slate-800 rounded-xl font-medium flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Emerald Pro
                  </button>
                  <button onClick={() => { setSelectedTheme('royal-sapphire'); setIsThemeDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-[11px] text-sky-300 hover:bg-slate-800 rounded-xl font-medium flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-sky-500"></span> Royal Sapphire
                  </button>
                  <button onClick={() => { setSelectedTheme('titanium-dark'); setIsThemeDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-[11px] text-slate-200 hover:bg-slate-800 rounded-xl font-medium flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-slate-400"></span> Titanium Dark
                  </button>
                </div>
              )}
            </div>

            {rightContent}
          </div>
        </div>

        {children && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 w-full pb-0 mb-0">
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {children}
            </div>
          </div>
        )}
        {bottomContent && (
          <div className="w-full">
            {bottomContent}
          </div>
        )}
      </div>
    </div>
  );
};
