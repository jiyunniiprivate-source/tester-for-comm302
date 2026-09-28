/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  BENCHMARK_INDICES,
  WORLD_INDICES_ITEMS,
  US_STOCKS_ITEMS,
  CRYPTO_ITEMS,
  SECONDARY_ASSETS,
  EARNINGS_REPORTS,
  CATEGORY_TABS,
  type Timeframe,
  type CategoryTab,
  type BenchmarkIndex,
  type MarketRowItem,
} from './data/marketData';

const TIMEFRAMES: Timeframe[] = ['1D', '5D', '1M', '6M', 'YTD', '1Y', 'ALL'];

const LANGUAGES = [
  { code: 'EN', label: 'English' },
  { code: 'DE', label: 'Deutsch' },
  { code: 'FR', label: 'Français' },
  { code: 'ES', label: 'Español' },
  { code: 'JA', label: '日本語' },
];

const REGIONS = [
  { id: 'global', label: 'Markets, everywhere', sub: 'Global overview' },
  { id: 'americas', label: 'Markets, Americas', sub: 'US, Canada & Latin America' },
  { id: 'europe', label: 'Markets, Europe', sub: 'UK, Eurozone & Nordics' },
  { id: 'apac', label: 'Markets, Asia-Pacific', sub: 'Japan, Hong Kong, India & Australia' },
];

export default function App() {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('Indices');
  const [selectedIndexId, setSelectedIndexId] = useState<string>('spx');
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('1D');
  const [hoveredChartPoint, setHoveredChartPoint] = useState<{
    x: number;
    y: number;
    label: string;
    price: string;
  } | null>(null);

  // Interactive UI Modals & Dropdowns
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullChartOpen, setIsFullChartOpen] = useState(false);
  const [showAllEarnings, setShowAllEarnings] = useState(false);
  const [screenerModalCategory, setScreenerModalCategory] = useState<
    null | 'world-indices' | 'us-stocks' | 'crypto'
  >(null);
  const [selectedQuoteItem, setSelectedQuoteItem] = useState<MarketRowItem | null>(null);
  const [selectedLang, setSelectedLang] = useState('EN');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [activeTopNav, setActiveTopNav] = useState<'Products' | 'Community' | 'Markets' | 'Brokers' | 'More'>('Markets');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsFullChartOpen(false);
        setScreenerModalCategory(null);
        setSelectedQuoteItem(null);
        setIsAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showNotice = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const selectedBenchmark: BenchmarkIndex = useMemo(() => {
    return BENCHMARK_INDICES.find((item) => item.id === selectedIndexId) || BENCHMARK_INDICES[0];
  }, [selectedIndexId]);

  const currentTfData = selectedBenchmark.timeframes[activeTimeframe];
  const chartColor = currentTfData.isPositive ? '#089981' : '#f23645';

  // Combined searchable assets for Ctrl+K modal
  const allSearchableItems = useMemo(() => {
    const list: Array<{
      id: string;
      symbol: string;
      name: string;
      subtitle: string;
      price: string;
      changePercent: string;
      isPositive: boolean;
      type: string;
      onSelect: () => void;
    }> = [];

    BENCHMARK_INDICES.forEach((b) => {
      list.push({
        id: b.id,
        symbol: b.symbol,
        name: b.name,
        subtitle: b.tickerSubtitle,
        price: b.price,
        changePercent: b.changePercent,
        isPositive: b.isPositive,
        type: 'Index',
        onSelect: () => {
          setSelectedIndexId(b.id);
          setIsSearchOpen(false);
        },
      });
    });

    [...WORLD_INDICES_ITEMS, ...US_STOCKS_ITEMS, ...CRYPTO_ITEMS].forEach((item) => {
      list.push({
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        subtitle: item.subtitle,
        price: item.price,
        changePercent: item.changePercent,
        isPositive: item.isPositive,
        type:
          item.category === 'world-indices'
            ? 'World Index'
            : item.category === 'us-stocks'
            ? 'US Stock'
            : 'Crypto',
        onSelect: () => {
          setSelectedQuoteItem(item);
          setIsSearchOpen(false);
        },
      });
    });

    return list;
  }, []);

  const filteredSearchItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allSearchableItems;
    return allSearchableItems.filter(
      (item) =>
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
    );
  }, [allSearchableItems, searchQuery]);

  const handleCategoryClick = (category: CategoryTab) => {
    setActiveCategory(category);
    const sectionMap: Partial<Record<CategoryTab, string>> = {
      Indices: 'section-indices',
      'US stocks': 'section-three-col',
      'World stocks': 'section-three-col',
      Crypto: 'section-three-col',
      'Futures & commodities': 'section-secondary-assets',
      'Forex & currencies': 'section-secondary-assets',
      'Government bonds': 'section-secondary-assets',
      'Corporate bonds': 'section-secondary-assets',
      ETFs: 'section-three-col',
      Economy: 'section-earnings',
    };
    const targetId = sectionMap[category];
    if (targetId && category !== 'Indices') {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const svgX = relX * 1000;
    const pts = currentTfData.points;
    let closest = pts[0];
    let minDiff = Math.abs(pts[0].x - svgX);
    for (const pt of pts) {
      const diff = Math.abs(pt.x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pt;
      }
    }
    setHoveredChartPoint(closest);
  };

  const displayedEarnings = showAllEarnings ? EARNINGS_REPORTS : EARNINGS_REPORTS.slice(0, 4);

  return (
    <div className="bg-white text-tv-gray-900 font-sans antialiased min-h-screen flex flex-col selection:bg-tv-blue selection:text-white">
      {/* BEGIN: MainHeader */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-tv-gray-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand & Global Search Bar */}
          <div className="flex items-center gap-6 flex-1 max-w-xl">
            <a
              aria-label="TradingView Home"
              className="flex items-center gap-1.5 focus:outline-none shrink-0"
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                setActiveCategory('Indices');
                setSelectedIndexId('spx');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              {/* TradingView Stylized Glyph */}
              <svg
                className="w-9 h-7 text-black fill-current"
                fill="none"
                viewBox="0 0 36 28"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4 4h5.5v19.5H4V4z" />
                <path d="M12.5 4h5.5v12h-5.5V4z" />
                <path d="M21 4h11v5.5H21V4z" />
                <path d="M21 11.5h7.5V17H21v-5.5z" />
              </svg>
            </a>

            {/* Search Input Pill matching screenshot */}
            <div className="relative w-full max-w-xs md:max-w-sm hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-tv-gray-500">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" x2="16.65" y1="21" y2="16.65" />
                </svg>
              </div>
              <input
                onClick={() => setIsSearchOpen(true)}
                className="w-full bg-[#f0f3fa] hover:bg-[#e7ebf3] text-tv-gray-700 text-sm rounded-full pl-10 pr-4 py-2 border-none transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-tv-blue"
                placeholder="Search (Ctrl+K)"
                readOnly
                type="text"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7 text-sm font-semibold">
            {(['Products', 'Community', 'Markets', 'Brokers', 'More'] as const).map((navItem) => {
              const isActive = activeTopNav === navItem;
              return (
                <a
                  key={navItem}
                  href={`#${navItem.toLowerCase()}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTopNav(navItem);
                    if (navItem === 'Products') {
                      setIsFullChartOpen(true);
                    } else if (navItem !== 'Markets') {
                      showNotice(`Viewing ${navItem} section`);
                    }
                  }}
                  className={
                    isActive
                      ? 'text-tv-blue relative py-5 whitespace-nowrap'
                      : 'text-tv-gray-700 hover:text-tv-gray-900 transition-colors whitespace-nowrap'
                  }
                >
                  {navItem}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-tv-blue rounded-full" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Utility Actions */}
          <div className="flex items-center space-x-4">
            {/* Mobile search trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search symbols"
              className="sm:hidden text-tv-gray-700 hover:text-tv-gray-900 p-2 rounded-full hover:bg-tv-gray-100 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" x2="16.65" y1="21" y2="16.65" />
              </svg>
            </button>

            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen((prev) => !prev)}
                className="flex items-center space-x-1.5 text-tv-gray-700 hover:text-tv-gray-900 text-sm font-medium px-2 py-1.5 rounded-lg hover:bg-tv-gray-100 transition-colors whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" x2="22" y1="12" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span>{selectedLang}</span>
              </button>
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white border border-tv-gray-200 rounded-xl shadow-lg py-1.5 z-50">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setSelectedLang(l.code);
                        setIsLangOpen(false);
                        showNotice(`Language switched to ${l.label}`);
                      }}
                      className={`w-full text-left px-3.5 py-1.5 text-xs font-semibold flex items-center justify-between hover:bg-tv-gray-50 ${
                        selectedLang === l.code ? 'text-tv-blue' : 'text-tv-gray-700'
                      }`}
                    >
                      <span>{l.label}</span>
                      <span className="text-tv-gray-500">{l.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile Icon */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              aria-label="User Account"
              className="text-tv-gray-700 hover:text-tv-gray-900 p-2 rounded-full hover:bg-tv-gray-100 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>

            {/* Vibrant Gradient CTA Button from screenshot */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-gradient-to-r from-[#1976d2] via-[#2962ff] to-[#9c27b0] hover:opacity-95 text-white font-semibold text-sm px-5 py-2 rounded-lg shadow-sm transition-all duration-150 inline-flex items-center justify-center whitespace-nowrap cursor-pointer"
            >
              Get started
            </button>
          </div>
        </div>
      </header>
      {/* END: MainHeader */}

      {/* BEGIN: HeroHeadline */}
      <section className="pt-10 pb-8 text-center px-4 relative" data-purpose="hero-title">
        <div
          onClick={() => setIsRegionOpen((prev) => !prev)}
          className="inline-flex items-center justify-center gap-2 cursor-pointer group select-none"
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-tv-gray-900">
            {selectedRegion.label}
          </h1>
          <svg
            className={`w-6 h-6 sm:w-7 sm:h-7 stroke-[3] text-tv-gray-900 transition-transform duration-200 ${
              isRegionOpen ? 'rotate-180' : 'group-hover:translate-y-0.5'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {isRegionOpen && (
          <div className="mt-2 mx-auto w-72 bg-white border border-tv-gray-200 rounded-2xl shadow-xl py-2 z-50 text-left">
            {REGIONS.map((reg) => (
              <button
                key={reg.id}
                onClick={() => {
                  setSelectedRegion(reg);
                  setIsRegionOpen(false);
                }}
                className={`w-full px-4 py-2.5 hover:bg-tv-gray-50 flex items-center justify-between transition-colors ${
                  selectedRegion.id === reg.id ? 'bg-tv-gray-50' : ''
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-tv-gray-900">{reg.label}</div>
                  <div className="text-xs text-tv-gray-500">{reg.sub}</div>
                </div>
                {selectedRegion.id === reg.id && (
                  <span className="w-2 h-2 rounded-full bg-tv-blue" />
                )}
              </button>
            ))}
          </div>
        )}
      </section>
      {/* END: HeroHeadline */}

      {/* BEGIN: CategoryNavigation */}
      <section className="border-b border-tv-gray-200 sticky top-16 bg-white z-40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-2 text-sm font-semibold whitespace-nowrap">
            {CATEGORY_TABS.map((tab) => {
              const isSelected = activeCategory === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleCategoryClick(tab)}
                  className={
                    isSelected
                      ? 'px-4 py-1.5 rounded-full bg-tv-gray-100 text-tv-gray-900 font-bold hover:bg-tv-gray-200 transition-colors cursor-pointer'
                      : 'px-4 py-1.5 rounded-full text-tv-gray-700 hover:text-tv-gray-900 hover:bg-tv-gray-100 transition-colors cursor-pointer'
                  }
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </section>
      {/* END: CategoryNavigation */}

      {/* BEGIN: MainContent */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 flex-1 space-y-12 w-full">
        {/* SECTION: Indices Benchmark Cards & Interactive Chart preview */}
        <section id="section-indices" className="space-y-4" data-purpose="indices-overview">
          <div className="flex items-center justify-between">
            <a
              href="#indices"
              onClick={(e) => {
                e.preventDefault();
                setScreenerModalCategory('world-indices');
              }}
              className="group inline-flex items-center gap-1.5 text-2xl font-bold tracking-tight text-tv-gray-900 hover:text-tv-blue transition-colors"
            >
              <span>Indices</span>
              <svg
                className="w-5 h-5 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
            <div className="flex items-center space-x-2 text-xs font-semibold text-tv-gray-500">
              <span className="inline-block w-2 h-2 rounded-full bg-tv-up animate-pulse" />
              <span>Market Open</span>
            </div>
          </div>

          {/* Benchmark Pill Row (Matches image tabs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
            {BENCHMARK_INDICES.map((item) => {
              const isSelected = item.id === selectedIndexId;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedIndexId(item.id);
                    setHoveredChartPoint(null);
                  }}
                  className={
                    isSelected
                      ? 'bg-[#f0f3fa] border-2 border-transparent rounded-full px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-tv-gray-200 transition-colors'
                      : 'bg-white border border-tv-gray-200 hover:bg-tv-gray-50 rounded-full px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors'
                  }
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span
                      style={{ backgroundColor: item.badgeBg }}
                      className={`w-8 h-8 rounded-full text-white font-bold ${
                        item.badgeTextSize || 'text-xs'
                      } flex items-center justify-center tracking-tighter shrink-0`}
                    >
                      {item.badgeText}
                    </span>
                    <div className="leading-tight truncate">
                      <div className="font-bold text-sm text-tv-gray-900 truncate">{item.name}</div>
                      <div className="text-xs text-tv-gray-500 tnum">{item.price}</div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold tnum shrink-0 ml-2 ${
                      item.isPositive ? 'text-tv-up' : 'text-tv-down'
                    }`}
                  >
                    {item.changePercent}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Interactive Chart & Market Overview Card */}
          <div className="border border-tv-gray-200 rounded-2xl p-5 bg-white shadow-sm mt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-tv-gray-100">
              <div>
                <div className="flex items-baseline space-x-3">
                  <h3 className="text-2xl font-extrabold tracking-tight text-tv-gray-900">
                    {selectedBenchmark.name}
                  </h3>
                  <span className="text-sm font-semibold text-tv-gray-500">
                    {selectedBenchmark.tickerSubtitle}
                  </span>
                </div>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-3xl font-extrabold tnum text-tv-gray-900">
                    {hoveredChartPoint ? hoveredChartPoint.price : selectedBenchmark.price}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-bold tnum ${
                      currentTfData.isPositive
                        ? 'bg-emerald-50 text-tv-up'
                        : 'bg-rose-50 text-tv-down'
                    }`}
                  >
                    {currentTfData.changePoints} ({currentTfData.changePercent})
                  </span>
                  {hoveredChartPoint && (
                    <span className="text-xs font-semibold text-tv-gray-500 tnum">
                      • {hoveredChartPoint.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Timeframe & Action Buttons */}
              <div className="flex items-center flex-wrap gap-2">
                <div className="flex items-center bg-tv-gray-100 p-1 rounded-lg text-xs font-semibold text-tv-gray-700">
                  {TIMEFRAMES.map((tf) => {
                    const isTfActive = activeTimeframe === tf;
                    return (
                      <button
                        key={tf}
                        onClick={() => {
                          setActiveTimeframe(tf);
                          setHoveredChartPoint(null);
                        }}
                        className={
                          isTfActive
                            ? 'px-2.5 py-1 rounded bg-white shadow-sm text-tv-gray-900 cursor-pointer'
                            : 'px-2.5 py-1 rounded hover:text-tv-gray-900 cursor-pointer'
                        }
                      >
                        {tf}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setIsFullChartOpen(true)}
                  className="border border-tv-gray-200 hover:border-tv-gray-300 text-tv-gray-900 font-semibold text-xs px-3.5 py-2 rounded-lg inline-flex items-center space-x-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Launch full chart view</span>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" x2="21" y1="14" y2="3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* SVG Financial Line Chart Visualization */}
            <div className="pt-6 relative h-48 sm:h-64 w-full">
              <svg
                onMouseMove={handleSvgMouseMove}
                onMouseLeave={() => setHoveredChartPoint(null)}
                className="w-full h-full overflow-visible cursor-crosshair"
                preserveAspectRatio="none"
                viewBox="0 0 1000 200"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={chartColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                <line stroke="#f0f3fa" strokeWidth="1" x1="0" x2="1000" y1="40" y2="40" />
                <line stroke="#f0f3fa" strokeWidth="1" x1="0" x2="1000" y1="90" y2="90" />
                <line stroke="#f0f3fa" strokeWidth="1" x1="0" x2="1000" y1="140" y2="140" />

                {/* Area & Line Path */}
                <path d={currentTfData.areaPath} fill="url(#chartGradient)" />
                <path
                  d={currentTfData.linePath}
                  fill="none"
                  stroke={chartColor}
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />

                {/* Hover Crosshair Guide */}
                {hoveredChartPoint && (
                  <g>
                    <line
                      x1={hoveredChartPoint.x}
                      x2={hoveredChartPoint.x}
                      y1="0"
                      y2="200"
                      stroke="#787b86"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <circle
                      cx={hoveredChartPoint.x}
                      cy={hoveredChartPoint.y}
                      r="5"
                      fill={chartColor}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </g>
                )}

                {/* Current Pulse Marker */}
                <circle cx="1000" cy={currentTfData.endY} fill={chartColor} r="4.5" />
                <circle
                  className="animate-ping"
                  cx="1000"
                  cy={currentTfData.endY}
                  fill={chartColor}
                  opacity="0.3"
                  r="9"
                />
              </svg>
            </div>
          </div>
        </section>

        {/* SECTION: Markets Grid 3 Columns (World Indices, US Big Tech, Crypto Movers) */}
        <section id="section-three-col" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUMN 1: World Indices */}
          <div className="space-y-4" data-purpose="world-indices-card">
            <div className="flex items-center justify-between">
              <a
                href="#world-indices"
                onClick={(e) => {
                  e.preventDefault();
                  setScreenerModalCategory('world-indices');
                }}
                className="group inline-flex items-center gap-1 text-lg font-bold text-tv-gray-900 hover:text-tv-blue"
              >
                <span>World indices</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
              <span className="text-xs text-tv-gray-500">Major markets</span>
            </div>
            <div className="border border-tv-gray-200 rounded-xl divide-y divide-tv-gray-100 overflow-hidden bg-white">
              {WORLD_INDICES_ITEMS.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedQuoteItem(item)}
                  className="p-3.5 flex items-center justify-between hover:bg-tv-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-7 h-7 rounded-full ${item.badgeBg} ${item.badgeTextColor} ${
                        item.badgeTextSize || 'text-xs'
                      } font-bold flex items-center justify-center`}
                    >
                      {item.badgeText}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-tv-gray-900">{item.name}</div>
                      <div className="text-xs text-tv-gray-500">{item.subtitle}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tnum text-tv-gray-900">{item.price}</div>
                    <div
                      className={`text-xs font-bold tnum ${
                        item.isPositive ? 'text-tv-up' : 'text-tv-down'
                      }`}
                    >
                      {item.changePercent}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setScreenerModalCategory('world-indices')}
              className="w-full block text-center text-xs font-bold text-tv-blue hover:text-tv-blue-hover py-2 border border-dashed border-tv-gray-200 rounded-lg hover:bg-blue-50/50 transition-colors cursor-pointer"
            >
              See all major indices →
            </button>
          </div>

          {/* COLUMN 2: US Stocks / Big Tech Movers */}
          <div className="space-y-4" data-purpose="us-stocks-card">
            <div className="flex items-center justify-between">
              <a
                href="#us-stocks"
                onClick={(e) => {
                  e.preventDefault();
                  setScreenerModalCategory('us-stocks');
                }}
                className="group inline-flex items-center gap-1 text-lg font-bold text-tv-gray-900 hover:text-tv-blue"
              >
                <span>US stocks</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
              <span className="text-xs text-tv-gray-500">Market cap &gt; $2T</span>
            </div>
            <div className="border border-tv-gray-200 rounded-xl divide-y divide-tv-gray-100 overflow-hidden bg-white">
              {US_STOCKS_ITEMS.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedQuoteItem(item)}
                  className="p-3.5 flex items-center justify-between hover:bg-tv-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-7 h-7 rounded-full ${item.badgeBg} ${item.badgeTextColor} ${
                        item.badgeTextSize || 'text-xs'
                      } font-bold flex items-center justify-center`}
                    >
                      {item.badgeText}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-tv-gray-900">{item.name}</div>
                      <div className="text-xs text-tv-gray-500">{item.subtitle}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tnum text-tv-gray-900">{item.price}</div>
                    <div
                      className={`text-xs font-bold tnum ${
                        item.isPositive ? 'text-tv-up' : 'text-tv-down'
                      }`}
                    >
                      {item.changePercent}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setScreenerModalCategory('us-stocks')}
              className="w-full block text-center text-xs font-bold text-tv-blue hover:text-tv-blue-hover py-2 border border-dashed border-tv-gray-200 rounded-lg hover:bg-blue-50/50 transition-colors cursor-pointer"
            >
              See all most actively traded stocks →
            </button>
          </div>

          {/* COLUMN 3: Crypto Market */}
          <div className="space-y-4" data-purpose="crypto-card">
            <div className="flex items-center justify-between">
              <a
                href="#crypto"
                onClick={(e) => {
                  e.preventDefault();
                  setScreenerModalCategory('crypto');
                }}
                className="group inline-flex items-center gap-1 text-lg font-bold text-tv-gray-900 hover:text-tv-blue"
              >
                <span>Crypto</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
              <span className="text-xs text-tv-gray-500">24/7 Global</span>
            </div>
            <div className="border border-tv-gray-200 rounded-xl divide-y divide-tv-gray-100 overflow-hidden bg-white">
              {CRYPTO_ITEMS.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedQuoteItem(item)}
                  className="p-3.5 flex items-center justify-between hover:bg-tv-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-7 h-7 rounded-full ${item.badgeBg} ${item.badgeTextColor} ${
                        item.badgeTextSize || 'text-xs'
                      } font-bold flex items-center justify-center`}
                    >
                      {item.badgeText}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-tv-gray-900">{item.name}</div>
                      <div className="text-xs text-tv-gray-500">{item.subtitle}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tnum text-tv-gray-900">{item.price}</div>
                    <div
                      className={`text-xs font-bold tnum ${
                        item.isPositive ? 'text-tv-up' : 'text-tv-down'
                      }`}
                    >
                      {item.changePercent}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setScreenerModalCategory('crypto')}
              className="w-full block text-center text-xs font-bold text-tv-blue hover:text-tv-blue-hover py-2 border border-dashed border-tv-gray-200 rounded-lg hover:bg-blue-50/50 transition-colors cursor-pointer"
            >
              See all coins ranking →
            </button>
          </div>
        </section>

        {/* SECTION: Currencies & Commodities Bar */}
        <section
          id="section-secondary-assets"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          data-purpose="secondary-assets-strip"
        >
          {SECONDARY_ASSETS.map((asset) => (
            <div
              key={asset.id}
              onClick={() =>
                setSelectedQuoteItem({
                  id: asset.id,
                  symbol: asset.symbol,
                  name: asset.name,
                  subtitle: asset.subtitle,
                  badgeText: asset.categoryLabel.slice(0, 2).toUpperCase(),
                  badgeBg: 'bg-tv-gray-100',
                  badgeTextColor: 'text-tv-gray-900',
                  price: asset.price,
                  changePercent: asset.change,
                  changePoints: asset.change,
                  isPositive: asset.isPositive,
                  category: 'forex',
                })
              }
              className="border border-tv-gray-200 rounded-xl p-4 bg-white hover:border-tv-gray-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase text-tv-gray-500 tracking-wider">
                  {asset.categoryLabel}
                </span>
                <span
                  className={`text-xs font-bold tnum ${
                    asset.isPositive ? 'text-tv-up' : 'text-tv-down'
                  }`}
                >
                  {asset.change}
                </span>
              </div>
              <div className="font-bold text-base text-tv-gray-900">{asset.name}</div>
              <div className="text-xl font-extrabold tnum mt-1">{asset.price}</div>
              <div className="text-xs text-tv-gray-500 mt-1">{asset.subtitle}</div>
            </div>
          ))}
        </section>

        {/* SECTION: Calendars & Market Pulse Snippet */}
        <section
          id="section-earnings"
          className="border border-tv-gray-200 rounded-2xl p-6 bg-tv-gray-50/50"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-tv-gray-200 gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-tv-gray-900">Earnings Calendar</h2>
              <p className="text-xs text-tv-gray-500">Key reports scheduled for today</p>
            </div>
            <button
              onClick={() => setShowAllEarnings((prev) => !prev)}
              className="text-xs font-bold text-tv-blue hover:text-tv-blue-hover cursor-pointer self-start sm:self-auto"
            >
              {showAllEarnings ? 'Show fewer earnings ←' : 'See all earnings →'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {displayedEarnings.map((report) => (
              <div
                key={report.id}
                onClick={() =>
                  showNotice(
                    `${report.symbol} (${report.company}) — ${report.quarter} report scheduled ${report.timeOfDay}`
                  )
                }
                className="bg-white border border-tv-gray-200 rounded-xl p-4 shadow-sm hover:border-tv-gray-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-tv-gray-900">{report.symbol}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-tv-gray-100 text-tv-gray-700 font-semibold">
                    {report.dateLabel}
                  </span>
                </div>
                <div className="text-xs text-tv-gray-500 truncate mt-0.5">{report.company}</div>
                <div className="mt-3 flex items-center justify-between text-xs tnum">
                  <span className="text-tv-gray-500">
                    Estimate: <strong className="text-tv-gray-700">{report.estimate}</strong>
                  </span>
                  <span className="text-tv-gray-500">
                    Actual: <strong className="text-tv-gray-900">{report.actual}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      {/* END: MainContent */}

      {/* BEGIN: Footer */}
      <footer className="bg-white border-t border-tv-gray-200 mt-16 pt-12 pb-8 text-xs text-tv-gray-500">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          {/* Footer Site Map Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8 pb-12 border-b border-tv-gray-100">
            <div>
              <h4 className="font-bold text-tv-gray-900 mb-3 text-sm">Products</h4>
              <ul className="space-y-2.5">
                {['Supercharts', 'Pine Script®', 'Stock Screener', 'ETF Screener', 'Heatmaps'].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={(e) => {
                          e.preventDefault();
                          if (link === 'Supercharts') setIsFullChartOpen(true);
                          else if (link === 'Stock Screener') setScreenerModalCategory('us-stocks');
                          else showNotice(`Opening ${link}`);
                        }}
                        className="hover:text-tv-gray-900 transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-tv-gray-900 mb-3 text-sm">Markets</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Indices', cat: 'Indices' as CategoryTab },
                  { label: 'Stocks', cat: 'US stocks' as CategoryTab },
                  { label: 'Crypto', cat: 'Crypto' as CategoryTab },
                  { label: 'Forex', cat: 'Forex & currencies' as CategoryTab },
                  { label: 'Bonds', cat: 'Government bonds' as CategoryTab },
                ].map((item) => (
                  <li key={item.label}>
                    <a
                      href={`#${item.label.toLowerCase()}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleCategoryClick(item.cat);
                      }}
                      className="hover:text-tv-gray-900 transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-tv-gray-900 mb-3 text-sm">Community</h4>
              <ul className="space-y-2.5">
                {['Social network', 'Wall of Love', 'Refer a friend', 'House Rules', 'Moderators'].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={(e) => {
                          e.preventDefault();
                          showNotice(`Navigating to ${link}`);
                        }}
                        className="hover:text-tv-gray-900 transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-tv-gray-900 mb-3 text-sm">Company</h4>
              <ul className="space-y-2.5">
                {['About', 'Careers', 'Blog', 'Security tips', 'Status page'].map((link) => (
                  <li key={link}>
                    <a
                      href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={(e) => {
                        e.preventDefault();
                        showNotice(`Viewing ${link}`);
                      }}
                      className="hover:text-tv-gray-900 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-tv-gray-900 mb-3 text-sm">Business</h4>
              <ul className="space-y-2.5">
                {[
                  'Widgets',
                  'Charting libraries',
                  'Lightweight Charts™',
                  'Brokerage integration',
                ].map((link) => (
                  <li key={link}>
                    <a
                      href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={(e) => {
                        e.preventDefault();
                        showNotice(`Exploring ${link}`);
                      }}
                      className="hover:text-tv-gray-900 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-tv-gray-900 mb-3 text-sm">Mobile &amp; Apps</h4>
              <ul className="space-y-2.5">
                {['Mobile iOS / Android', 'Desktop Mac / Windows', 'TradingView Store'].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={(e) => {
                          e.preventDefault();
                          showNotice(`Viewing ${link}`);
                        }}
                        className="hover:text-tv-gray-900 transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          {/* Legal & Attribution Section */}
          <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-medium text-tv-gray-700">Made by humans.</div>
              <p className="text-[11px] leading-relaxed max-w-4xl">
                Select market data provided by{' '}
                <a
                  className="underline hover:text-tv-gray-900"
                  href="#ice-data"
                  onClick={(e) => {
                    e.preventDefault();
                    showNotice('ICE Data Services market feed attribution');
                  }}
                >
                  ICE Data Services
                </a>
                . Select reference data provided by FactSet. Copyright © 2026 FactSet Research
                Systems Inc. Copyright © 2026, American Bankers Association. CUSIP Database provided
                by FactSet Research Systems Inc. All rights reserved. SEC filings and other
                documents provided by Quartr. © 2026 TradingView, Inc.
              </p>
            </div>

            {/* Social Media Icons Strip */}
            <div className="flex items-center space-x-3 text-tv-gray-500">
              <a
                aria-label="X / Twitter"
                className="hover:text-tv-gray-900"
                href="#social-x"
                onClick={(e) => {
                  e.preventDefault();
                  showNotice('Opening official X profile');
                }}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                aria-label="Facebook"
                className="hover:text-tv-gray-900"
                href="#social-fb"
                onClick={(e) => {
                  e.preventDefault();
                  showNotice('Opening official Facebook page');
                }}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                </svg>
              </a>
              <a
                aria-label="YouTube"
                className="hover:text-tv-gray-900"
                href="#social-yt"
                onClick={(e) => {
                  e.preventDefault();
                  showNotice('Opening official YouTube channel');
                }}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
                </svg>
              </a>
              <a
                aria-label="LinkedIn"
                className="hover:text-tv-gray-900"
                href="#social-li"
                onClick={(e) => {
                  e.preventDefault();
                  showNotice('Opening official LinkedIn page');
                }}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34M7.86 18.5V10.1h-2.8v8.4h2.8z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
      {/* END: Footer */}

      {/* MODAL 1: Command+K Global Symbol Search */}
      {isSearchOpen && (
        <div
          onClick={() => setIsSearchOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-tv-gray-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
          >
            <div className="p-4 border-b border-tv-gray-100 flex items-center gap-3">
              <svg
                className="w-5 h-5 text-tv-gray-500 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" x2="16.65" y1="21" y2="16.65" />
              </svg>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol, index, stock, or crypto (e.g. SPX, NVDA, BTC)..."
                className="w-full text-sm text-tv-gray-900 placeholder-tv-gray-500 focus:outline-none"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-xs font-semibold text-tv-gray-500 hover:text-tv-gray-900 px-2 py-1 rounded bg-tv-gray-100"
              >
                ESC
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-tv-gray-100">
              {filteredSearchItems.length === 0 ? (
                <div className="p-8 text-center text-sm text-tv-gray-500">
                  No matching instruments found for "{searchQuery}"
                </div>
              ) : (
                filteredSearchItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.onSelect}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-tv-gray-50 transition-colors text-left cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-tv-gray-900">{item.name}</span>
                        <span className="text-xs text-tv-gray-500">{item.symbol}</span>
                      </div>
                      <div className="text-xs text-tv-gray-500">{item.subtitle}</div>
                    </div>
                    <div className="text-right tnum">
                      <div className="text-sm font-semibold text-tv-gray-900">{item.price}</div>
                      <div
                        className={`text-xs font-bold ${
                          item.isPositive ? 'text-tv-up' : 'text-tv-down'
                        }`}
                      >
                        {item.changePercent}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Superchart View Modal */}
      {isFullChartOpen && (
        <div
          onClick={() => setIsFullChartOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-tv-gray-200 rounded-2xl shadow-2xl w-full max-w-5xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-tv-gray-200 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span
                    style={{ backgroundColor: selectedBenchmark.badgeBg }}
                    className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center"
                  >
                    {selectedBenchmark.badgeText}
                  </span>
                  <h2 className="text-xl font-extrabold text-tv-gray-900">
                    {selectedBenchmark.fullName} ({selectedBenchmark.symbol})
                  </h2>
                </div>
                <p className="text-xs text-tv-gray-500 mt-1">
                  Supercharts Interactive Terminal • Real-Time Index Feed
                </p>
              </div>
              <button
                onClick={() => setIsFullChartOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-tv-gray-100 hover:bg-tv-gray-200 text-xs font-bold text-tv-gray-900 cursor-pointer"
              >
                Close chart ✕
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold tnum text-tv-gray-900">
                  {selectedBenchmark.price}
                </span>
                <span
                  className={`text-sm font-bold tnum ${
                    currentTfData.isPositive ? 'text-tv-up' : 'text-tv-down'
                  }`}
                >
                  {currentTfData.changePoints} ({currentTfData.changePercent})
                </span>
              </div>

              <div className="flex items-center gap-1 bg-tv-gray-100 p-1 rounded-lg text-xs font-semibold">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setActiveTimeframe(tf)}
                    className={
                      activeTimeframe === tf
                        ? 'px-3 py-1 rounded bg-white shadow-sm text-tv-gray-900'
                        : 'px-3 py-1 rounded text-tv-gray-700 hover:text-tv-gray-900'
                    }
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-80 w-full border border-tv-gray-200 rounded-xl p-4 bg-tv-gray-50/40">
              <svg
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 1000 200"
              >
                <line stroke="#e0e3eb" strokeWidth="1" x1="0" x2="1000" y1="40" y2="40" />
                <line stroke="#e0e3eb" strokeWidth="1" x1="0" x2="1000" y1="90" y2="90" />
                <line stroke="#e0e3eb" strokeWidth="1" x1="0" x2="1000" y1="140" y2="140" />
                <path d={currentTfData.areaPath} fill="url(#chartGradient)" />
                <path
                  d={currentTfData.linePath}
                  fill="none"
                  stroke={chartColor}
                  strokeLinecap="round"
                  strokeWidth="3"
                />
                <circle cx="1000" cy={currentTfData.endY} fill={chartColor} r="5" />
              </svg>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-tv-gray-100 text-xs">
              <div>
                <span className="text-tv-gray-500">Previous Close</span>
                <div className="font-bold text-tv-gray-900 tnum mt-0.5">5,840.05</div>
              </div>
              <div>
                <span className="text-tv-gray-500">Day's Range</span>
                <div className="font-bold text-tv-gray-900 tnum mt-0.5">5,838.12 — 5,871.40</div>
              </div>
              <div>
                <span className="text-tv-gray-500">52-Week Range</span>
                <div className="font-bold text-tv-gray-900 tnum mt-0.5">4,103.78 — 5,878.46</div>
              </div>
              <div>
                <span className="text-tv-gray-500">Market Status</span>
                <div className="font-bold text-tv-up mt-0.5">Market Open • Real-time</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Quote Detail Modal for Individual Row Items */}
      {selectedQuoteItem && (
        <div
          onClick={() => setSelectedQuoteItem(null)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-tv-gray-200 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-9 h-9 rounded-full ${selectedQuoteItem.badgeBg} ${selectedQuoteItem.badgeTextColor} text-xs font-bold flex items-center justify-center`}
                >
                  {selectedQuoteItem.badgeText}
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-tv-gray-900">
                    {selectedQuoteItem.name}
                  </h3>
                  <p className="text-xs text-tv-gray-500">{selectedQuoteItem.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuoteItem(null)}
                className="text-xs font-bold text-tv-gray-500 hover:text-tv-gray-900 px-2.5 py-1 rounded bg-tv-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-3 border-y border-tv-gray-100 flex items-baseline justify-between">
              <div className="text-2xl font-extrabold tnum text-tv-gray-900">
                {selectedQuoteItem.price}
              </div>
              <div
                className={`text-sm font-bold tnum ${
                  selectedQuoteItem.isPositive ? 'text-tv-up' : 'text-tv-down'
                }`}
              >
                {selectedQuoteItem.changePoints} ({selectedQuoteItem.changePercent})
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-tv-gray-50">
                <div className="text-tv-gray-500">Symbol</div>
                <div className="font-bold text-tv-gray-900 mt-0.5">{selectedQuoteItem.symbol}</div>
              </div>
              <div className="p-3 rounded-xl bg-tv-gray-50">
                <div className="text-tv-gray-500">Market Cap / High</div>
                <div className="font-bold text-tv-gray-900 tnum mt-0.5">
                  {selectedQuoteItem.marketCap || selectedQuoteItem.high52W || 'Active Feed'}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const name = selectedQuoteItem.name;
                  setSelectedQuoteItem(null);
                  showNotice(`Added ${name} to Watchlist`);
                }}
                className="px-4 py-2 rounded-lg bg-tv-blue hover:bg-tv-blue-hover text-white text-xs font-bold cursor-pointer"
              >
                Add to Watchlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Category Screener Modal ("See all major indices / US stocks / Crypto") */}
      {screenerModalCategory && (
        <div
          onClick={() => setScreenerModalCategory(null)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-tv-gray-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-tv-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-tv-gray-900">
                  {screenerModalCategory === 'world-indices'
                    ? 'Major World Indices'
                    : screenerModalCategory === 'us-stocks'
                    ? 'Most Actively Traded US Stocks'
                    : 'Cryptocurrency Market Rankings'}
                </h3>
                <p className="text-xs text-tv-gray-500">Live quotes and daily percentage change</p>
              </div>
              <button
                onClick={() => setScreenerModalCategory(null)}
                className="px-3 py-1 rounded-lg bg-tv-gray-100 hover:bg-tv-gray-200 text-xs font-bold text-tv-gray-700 cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            <div className="divide-y divide-tv-gray-100 max-h-96 overflow-y-auto">
              {(screenerModalCategory === 'world-indices'
                ? WORLD_INDICES_ITEMS
                : screenerModalCategory === 'us-stocks'
                ? US_STOCKS_ITEMS
                : CRYPTO_ITEMS
              ).map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setScreenerModalCategory(null);
                    setSelectedQuoteItem(item);
                  }}
                  className="p-4 flex items-center justify-between hover:bg-tv-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-8 h-8 rounded-full ${item.badgeBg} ${item.badgeTextColor} text-xs font-bold flex items-center justify-center`}
                    >
                      {item.badgeText}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-tv-gray-900">{item.name}</div>
                      <div className="text-xs text-tv-gray-500">{item.subtitle}</div>
                    </div>
                  </div>
                  <div className="text-right tnum">
                    <div className="text-sm font-semibold text-tv-gray-900">{item.price}</div>
                    <div
                      className={`text-xs font-bold ${
                        item.isPositive ? 'text-tv-up' : 'text-tv-down'
                      }`}
                    >
                      {item.changePoints} ({item.changePercent})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Get Started / Account Modal */}
      {isAuthModalOpen && (
        <div
          onClick={() => setIsAuthModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-tv-gray-200 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-tv-gray-900">Get started on TradingView</h3>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="text-xs font-bold text-tv-gray-500 hover:text-tv-gray-900 px-2.5 py-1 rounded bg-tv-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-tv-gray-500 leading-relaxed">
              Track real-time world indices, customize watchlists, and unlock Supercharts technical
              analysis across global markets.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsAuthModalOpen(false);
                showNotice('Welcome to TradingView! Custom watchlist enabled.');
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-tv-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  placeholder="trader@example.com"
                  className="w-full px-3.5 py-2 text-sm border border-tv-gray-200 rounded-lg focus:outline-none focus:border-tv-blue"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#1976d2] via-[#2962ff] to-[#9c27b0] hover:opacity-95 text-white font-semibold text-sm py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Continue with Email
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-tv-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-tv-up" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
