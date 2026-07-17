import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Building2, UserCog, DoorOpen, Users, FileText, Wallet,
  Receipt, Wrench, PieChart, Settings as SettingsIcon, Database, UsersRound,
  LogOut, Menu, X, Search, Sun, Moon, Globe, Building, Zap, Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const NAV_SECTIONS = (t) => [
  { items: [{ to: '/', label: t('dashboard'), icon: LayoutDashboard, color: 'primary' }] },
  { items: [
    { to: '/owners', label: t('owners'), icon: UserCog, color: 'indigo' },
    { to: '/properties', label: t('properties'), icon: Building2, color: 'blue' },
    { to: '/units', label: t('units'), icon: DoorOpen, color: 'cyan' },
  ] },
  { items: [
    { to: '/tenants', label: t('tenants'), icon: Users, color: 'emerald' },
    { to: '/contracts', label: t('contracts'), icon: FileText, color: 'amber' },
    { to: '/payments', label: t('payments'), icon: Wallet, color: 'green' },
  ] },
  { items: [
    { to: '/expenses', label: t('expenses'), icon: Receipt, color: 'red' },
    { to: '/utilities', label: t('utility_bills'), icon: Zap, color: 'amber' },
    { to: '/maintenance', label: t('maintenance'), icon: Wrench, color: 'orange' },
  ] },
  { items: [{ to: '/reports', label: t('reports'), icon: PieChart, color: 'pink' }] },
  { items: [
    { to: '/settings', label: t('settings'), icon: SettingsIcon, color: 'gray' },
    { to: '/users', label: t('users'), icon: UsersRound, color: 'purple' },
  ] },
];

const COLOR_MAP = {
  primary: { bg: 'bg-blue-50 dark:bg-blue-900/30', icon: 'text-blue-600 dark:text-blue-400' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/30', icon: 'text-indigo-600 dark:text-indigo-400' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/30', icon: 'text-blue-600 dark:text-blue-400' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/30', icon: 'text-cyan-600 dark:text-cyan-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400' },
  green: { bg: 'bg-green-50 dark:bg-green-900/30', icon: 'text-green-600 dark:text-green-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/30', icon: 'text-amber-600 dark:text-amber-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/30', icon: 'text-orange-600 dark:text-orange-400' },
  red: { bg: 'bg-red-50 dark:bg-red-900/30', icon: 'text-red-600 dark:text-red-400' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-900/30', icon: 'text-pink-600 dark:text-pink-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/30', icon: 'text-purple-600 dark:text-purple-400' },
  gray: { bg: 'bg-gray-100 dark:bg-gray-700', icon: 'text-gray-500 dark:text-gray-400' },
};

export default function Layout() {
  const { user, logout, lang, toggleLang, darkMode, toggleDark, t } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isRTL = lang === 'ar';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex">
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden" />
      )}

      <aside className={`fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-50 w-72 bg-white dark:bg-gray-800 border-e border-gray-100 dark:border-gray-700/50 lg:static lg:z-auto flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')}`}>
        <div className="relative h-20 px-6 flex items-center gap-3 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
          <div className="relative z-10 flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Building className="text-white" size={20} />
              </div>
              <div>
                <p className="text-white font-bold text-base leading-tight">{t('app_name')}</p>
                <p className="text-blue-200 text-[10px] font-medium">Property Management</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/70 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_SECTIONS(t).map((section, si) => (
            <div key={si} className="space-y-1 mb-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                const c = COLOR_MAP[item.color] || COLOR_MAP.gray;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-600/50'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/40 dark:hover:text-gray-200'
                      }`
                    }
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bg}`}>
                      <Icon size={14} className={c.icon} />
                    </div>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-100 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-white text-sm font-bold">{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user?.role === 'admin' ? t('admin') : t('user')}</p>
            </div>
            <button onClick={handleLogout} title={t('logout')} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-700/50 flex items-center px-4 sm:px-6 gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex-1 flex justify-center max-w-xl mx-auto">
            <div className="w-full hidden sm:block relative">
              <input type="text" placeholder={t('search_placeholder')} className={`w-full ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-2.5 text-sm bg-gray-50/80 dark:bg-gray-700/40 border border-gray-200/60 dark:border-gray-600/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white dark:focus:bg-gray-700/60 text-gray-900 dark:text-gray-100`} />
              <Search size={14} className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleLang} className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200/60 dark:border-gray-600/60 hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Globe size={11} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
            <button onClick={toggleDark} title="Toggle theme" className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200/60 dark:border-gray-600/60 hover:border-amber-300 dark:hover:border-amber-500 transition-colors">
              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${darkMode ? 'from-indigo-400 to-indigo-600' : 'from-amber-400 to-amber-600'} flex items-center justify-center`}>
                {darkMode ? <Moon size={11} className="text-white" /> : <Sun size={11} className="text-white" />}
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:inline">{darkMode ? t('dark_mode') : t('light_mode')}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>

        <footer className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">&copy; {new Date().getFullYear()} {t('app_name')}. {t('all_rights_reserved')}</p>
        </footer>
      </div>
    </div>
  );
}
