import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Palette, ChevronDown, PlusCircle } from 'lucide-react';

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
  showThemeSelector?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  badgeText,
  badgeActive = true,
  rightContent,
  children,
  bottomContent,
  showThemeSelector = false
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
    <div className={`relative rounded-2xl p-2 sm:px-4 sm:py-2 bg-gradient-to-r ${themeStyles.banner} border shadow-xl transition-all duration-300 mb-3 w-full`}>
      {/* Glow ambient spots */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col gap-1 w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-1.5">
          {/* Title & Subtitle block */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white flex items-center gap-2 whitespace-nowrap">
                <Icon className={`${themeStyles.accentText} shrink-0`} size={18} />
                <span className="whitespace-nowrap">{title}</span>
              </h1>

              {badgeText && (
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold ${themeStyles.badge}`}>
                  {badgeActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
                  {badgeText}
                </span>
              )}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center justify-end gap-2 sm:gap-2.5 flex-wrap shrink-0 self-end ml-auto">
            {rightContent}
            
            {/* Color Theme Selector */}
            {showThemeSelector && (
              <div className="relative shrink-0" ref={dropdownRef}>
                <button 
                  onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                  className="p-1.5 md:px-3 md:py-1.5 bg-white/10 hover:bg-white/15 border border-white/20 text-slate-200 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-[32px]"
                >
                  <Palette size={14} className="text-amber-400" />
                  <span className="capitalize hidden md:inline-block">{selectedTheme.replace('-', ' ')}</span>
                  <ChevronDown size={13} className="hidden md:inline-block" />
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
            )}

            {/* Create Order Global Button */}
            <button
              onClick={() => window.dispatchEvent(new Event('open-create-order'))}
              className="p-1.5 md:px-4 md:py-1.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-extrabold text-[11px] md:text-[12px] transition cursor-pointer shadow-lg flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <PlusCircle size={16} />
              <span className="hidden md:inline-block">Create Order</span>
            </button>
          </div>
        </div>

        {children && (
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 w-full mt-1 border-t border-white/5 pt-1.5">
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-end">
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
