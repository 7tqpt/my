import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../lib/translations';
import { authLogin, authMe } from '../lib/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [lang, setLangState] = useState(() => localStorage.getItem('pm_lang') || 'ar');
  const [darkMode, setDarkModeState] = useState(() => localStorage.getItem('pm_dark') === 'true');

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('pm_lang', lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('pm_dark', darkMode);
  }, [darkMode]);

  // On mount, if we have a token, verify it via /auth/me
  useEffect(() => {
    const token = localStorage.getItem('pm_token');
    if (token && !user) {
      authMe().then((u) => {
        setUser(u);
        localStorage.setItem('pm_user', JSON.stringify(u));
      }).catch(() => {
        localStorage.removeItem('pm_token');
        localStorage.removeItem('pm_user');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username, password) => {
    try {
      const res = await authLogin(username, password);
      localStorage.setItem('pm_token', res.access_token);
      localStorage.setItem('pm_user', JSON.stringify(res.user));
      setUser(res.user);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.response?.data?.detail || e.message };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('pm_token');
      if (token) {
        // Best-effort logout on the server to invalidate the session
        await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) { /* ignore */ }
    setUser(null);
    localStorage.removeItem('pm_user');
    localStorage.removeItem('pm_token');
  };

  const t = (key) => translations[lang]?.[key] ?? translations.ar[key] ?? key;
  const setLang = (l) => setLangState(l);
  const toggleLang = () => setLangState(lang === 'ar' ? 'en' : 'ar');
  const toggleDark = () => setDarkModeState(!darkMode);

  return (
    <AppContext.Provider value={{ user, login, logout, lang, setLang, toggleLang, darkMode, toggleDark, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
