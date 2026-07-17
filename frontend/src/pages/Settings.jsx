import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Building, Phone, Mail, MapPin, DollarSign, Clock, Save, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSettings, updateSettings } from '../lib/api';

export default function Settings() {
  const { t, lang, user } = useApp();
  const isRTL = lang === 'ar';
  const [settings, setSettings] = useState({
    company_name: '', company_phone: '', company_email: '',
    company_address: '', currency: 'SAR', timezone: 'Asia/Riyadh',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSettings().then((data) => {
      setSettings((prev) => ({ ...prev, ...data }));
    }).catch(() => {});
  }, []);

  const handleChange = (key, value) => setSettings({ ...settings, [key]: value });

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    }
  };

  const fields = [
    { key: 'company_name', label: t('company_name'), icon: Building, type: 'text' },
    { key: 'company_phone', label: t('company_phone'), icon: Phone, type: 'text' },
    { key: 'company_email', label: t('company_email'), icon: Mail, type: 'email' },
    { key: 'company_address', label: t('company_address'), icon: MapPin, type: 'text' },
    { key: 'currency', label: t('currency'), icon: DollarSign, type: 'text' },
    { key: 'timezone', label: t('timezone'), icon: Clock, type: 'text' },
  ];

  const canEdit = user?.role === 'admin';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className={`relative overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl p-6 text-white shadow-lg`}>
        <div className="absolute inset-0 opacity-10">
          <svg className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-0 h-full w-1/2`} viewBox="0 0 400 200" fill="none">
            <circle cx="350" cy="50" r="120" fill="white" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center"><SettingsIcon size={24} /></div>
          <div>
            <h1 className="text-2xl font-bold">{t('settings')}</h1>
            <p className="text-white/80 text-sm">{t('company_settings')}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t('company_settings')}</h2>
        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fields.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{f.label}</label>
                <div className="relative">
                  <Icon size={15} className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} />
                  <input
                    type={f.type}
                    value={settings[f.key] || ''}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    disabled={!canEdit}
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:text-gray-100 disabled:opacity-60`}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
          {saved && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <Check size={16} />
              <span>{t('save')} ✓</span>
            </div>
          )}
          <button type="submit" disabled={!canEdit} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60">
            <Save size={16} />{t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
