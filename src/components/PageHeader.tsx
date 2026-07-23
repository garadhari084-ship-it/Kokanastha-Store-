import React, { useMemo, useState } from 'react';
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
    <div className={`relative rounded-none px-6 pt-3 pb-3 md:px-8 md:pt-4 md:pb-4 bg-gradient-to-r ${themeStyles.banner} border shadow-2xl transition-all duration-300 mb-6`}>
      {badgeText && (
        <div className="absolute top-0 right-0 z-20">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-none border-l border-b text-[10px] md:text-[11px] font-bold backdrop-blur-md ${themeStyles.badge}`}>
            {badgeActive && <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-400 animate-pulse"></span>}
            {badgeText}
          </span>
        </div>
      )}
      
      {/* Glow ambient spots */}
      <div className="absolute inset-0 overflow-hidden rounded-none pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pr-32 md:pr-40">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                <Icon className={themeStyles.accentText} />
                <span>{title}</span>
              </h1>
            </div>
            <p className="text-xs font-medium text-slate-300 flex flex-wrap items-center gap-2">
              <span>{subtitle}</span>
            </p>
          </div>
        </div>

        {/* Top Control Bar: Theme Switcher and other controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 w-full pb-0 mb-0">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            {/* Color Theme Selector */}
            <div className="relative shrink-0">
              <button 
                onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-slate-200 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Palette size={15} className="text-amber-400" />
                <span className="capitalize">{selectedTheme.replace('-', ' ')}</span>
                <ChevronDown size={14} />
              </button>
              
              {isThemeDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50">
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

            {/* Children (e.g., date selectors) */}
            {children}
          </div>
          
          {rightContent && (
            <div className="flex items-center gap-2 flex-wrap">
              {rightContent}
            </div>
          )}
        </div>
        {bottomContent && (
          <div className="w-full">
            {bottomContent}
          </div>
        )}
      </div>
    </div>
  );
};
