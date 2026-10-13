import React, { useState } from 'react';
import {
  BookOpen,
  LayoutDashboard,
  CheckCircle2,
  Timer,
  Layers,
  Bookmark,
  RotateCcw,
  BarChart3,
  ShieldAlert,
  LogOut,
  User,
  Menu,
  X,
  Languages,
  ChevronDown,
  Sparkles,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppLanguage } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAuthModal: (mode?: 'login' | 'register' | 'forgot' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openAuthModal }) => {
  const { user, profile, isAdmin, logout, language, setLanguage } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const desktopNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'practice', label: 'MCQ Practice', icon: CheckCircle2 },
    { id: 'mocktest', label: 'Mock Test', icon: Timer },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
    { id: 'revision', label: 'Revision', icon: RotateCcw },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  // Mobile bottom bar 4 primary items + 1 "More" button
  const mobileBottomItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'practice', label: 'Practice', icon: CheckCircle2 },
    { id: 'mocktest', label: 'Mock Test', icon: Timer },
    { id: 'flashcards', label: 'Cards', icon: Layers },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileDrawerOpen(false);
  };

  const languagesMap: { id: AppLanguage; label: string; sub: string }[] = [
    { id: 'bilingual', label: 'Bilingual', sub: 'हिंदी + English' },
    { id: 'hi', label: 'Hindi', sub: 'हिंदी' },
    { id: 'en', label: 'English', sub: 'English' }
  ];

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo & Exam Badge */}
            <div
              className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0"
              onClick={() => handleNavClick('dashboard')}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                    PET Prep
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 tracking-wider">
                    UPSSSC
                  </span>
                </div>
                <p className="hidden xs:block text-[10px] sm:text-[11px] text-slate-400 font-medium">Smart Practice</p>
              </div>
            </div>

            {/* Desktop Navigation links */}
            <nav className="hidden lg:flex items-center space-x-1">
              {desktopNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Admin Portal link */}
              {isAdmin && (
                <button
                  onClick={() => handleNavClick('admin')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'admin'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-amber-400 bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Admin Portal</span>
                </button>
              )}
            </nav>

            {/* Right actions: Language, Try Admin, Auth */}
            <div className="flex items-center space-x-1.5 sm:space-x-2.5">
              {/* Language Selector (desktop & mobile) */}
              <div className="relative">
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[11px] sm:text-xs border border-slate-700 hover:border-slate-600 transition"
                  title="Select Question Language"
                >
                  <Languages className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="capitalize">{language === 'bilingual' ? 'Bi' : language}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {langDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-44 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-1 z-50 text-xs no-scrollbar"
                    onMouseLeave={() => setLangDropdownOpen(false)}
                  >
                    <div className="px-3 py-1.5 font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                      Question Language
                    </div>
                    {languagesMap.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => {
                          setLanguage(l.id);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-700 transition ${
                          language === l.id ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-200'
                        }`}
                      >
                        <span>{l.label}</span>
                        <span className="text-[10px] text-slate-400">{l.sub}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User profile / Login */}
              {user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 sm:gap-2 pl-1.5 pr-2 sm:pr-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold uppercase text-white shadow-inner shrink-0">
                      {profile?.displayName?.charAt(0) || (isAdmin ? 'A' : 'C')}
                    </div>
                    <span className="hidden sm:inline text-xs font-semibold text-slate-200 max-w-[80px] truncate">
                      {profile?.displayName || (isAdmin ? 'Admin' : 'Candidate')}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-52 sm:w-56 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-1.5 z-50 text-xs no-scrollbar"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-slate-700/80">
                        <p className="font-semibold text-white truncate">{profile?.displayName || (isAdmin ? 'Admin' : 'Aspirant')}</p>
                        <p className="text-[11px] text-blue-400 font-medium truncate">{isAdmin ? 'Verified Administrator' : 'Candidate Account'}</p>
                      </div>

                      <button
                        onClick={() => {
                          handleNavClick('dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>My Dashboard</span>
                      </button>

                      {isAdmin ? (
                        <button
                          onClick={() => {
                            handleNavClick('admin');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-amber-300 hover:bg-slate-700 flex items-center gap-2"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                          <span>Admin Portal</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            handleNavClick('admin');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-slate-300 hover:text-amber-300 hover:bg-slate-700 flex items-center gap-2"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                          <span>Admin Login</span>
                        </button>
                      )}

                      <div className="my-1 border-t border-slate-700" />
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] sm:text-xs transition shadow-md shadow-blue-600/20"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuthModal('admin')}
                    title="Admin Passkey Portal"
                    className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 hover:text-amber-200 font-semibold text-[11px] sm:text-xs transition"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admin</span>
                  </button>
                </div>
              )}

              {/* Hamburger for mobile top drawer - Prominently styled and guaranteed visibility */}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 hover:text-white border border-slate-700 shadow-xs transition shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Open navigation menu"
                title="Navigation Menu"
              >
                <Menu className="w-5 h-5 text-slate-200" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-slate-900 border-l border-slate-800 shadow-2xl p-5 flex flex-col justify-between z-50 animate-fade-in no-scrollbar overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-white text-base block leading-tight">PET Prep</span>
                    <span className="text-[10px] text-blue-400 font-semibold">UPSSSC Examination</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Language Selector in Drawer */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-blue-400" />
                    <span>Question Language</span>
                  </span>
                  <span className="text-[10px] uppercase text-blue-400 font-bold">{language}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {languagesMap.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLanguage(l.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition ${
                        language === l.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation items list */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider px-1 mb-1">
                  Menu Items
                </p>
                {desktopNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-blue-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => handleNavClick('admin')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition mt-2 ${
                      activeTab === 'admin'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Admin Question Portal</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      openAuthModal('admin');
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 transition mt-2"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Admin Passkey Login</span>
                  </button>
                )}
              </div>
            </div>

            {/* Drawer Bottom Controls */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              {user ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <p className="text-xs font-bold text-white truncate">{profile?.displayName || (isAdmin ? 'Admin' : 'Candidate')}</p>
                    <p className="text-[10px] text-blue-400 font-medium truncate">{isAdmin ? 'Verified Administrator' : 'Candidate Account'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileDrawerOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/20 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  <span>Candidate Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Navigation Bar (App-like thumb experience) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-2 py-1.5 shadow-2xl">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {mobileBottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                  isActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </button>
            );
          })}

          {/* 5th Action: More menu with Hamburger icon */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex flex-col items-center justify-center py-1 rounded-xl text-slate-400 hover:text-slate-200"
            aria-label="Open menu drawer"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
};
