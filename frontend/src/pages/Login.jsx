import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, User, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Globe, AlertTriangle, PieChart, ShieldCheck, Zap, Smartphone } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login, t, lang, toggleLang } = useApp();
  const navigate = useNavigate();
  const isRTL = lang === 'ar';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(username, password);
    setLoading(false);
    if (res.ok) navigate('/');
    else setError(res.error || (isRTL ? 'بيانات غير صحيحة' : 'Invalid credentials'));
  };

  const Feature = ({ icon: Icon, color, title, desc }) => {
    const colorMap = {
      blue: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
      amber: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
      purple: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
    };
    const c = colorMap[color] || colorMap.blue;
    return (
      <div className="feature-card rounded-2xl p-5">
        <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
          <Icon className={c.text} size={22} strokeWidth={2} />
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen auth-bg">
      <style>{`
        .auth-bg {
          background-color: #0f172a;
          background-image:
            radial-gradient(at 20% 80%, rgba(59,130,246,0.15) 0px, transparent 50%),
            radial-gradient(at 80% 20%, rgba(99,102,241,0.12) 0px, transparent 50%),
            radial-gradient(at 50% 50%, rgba(14,165,233,0.08) 0px, transparent 70%);
        }
        .grid-bg {
          background-image:
            linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px);
          background-size: 64px 64px;
        }
        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
          animation: pulse-slow 8s ease-in-out infinite alternate;
        }
        @keyframes pulse-slow {
          0% { opacity: 0.3; transform: scale(1); }
          100% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fade-in-up 0.6s ease-out both; }
        .animate-in-delay-1 { animation-delay: 0.1s; }
        .animate-in-delay-2 { animation-delay: 0.2s; }
        .animate-in-delay-3 { animation-delay: 0.3s; }
        .btn-brand {
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          transition: box-shadow 0.3s, transform 0.3s;
          box-shadow: 0 4px 14px rgba(37,99,235,0.35);
        }
        .btn-brand:hover {
          box-shadow: 0 6px 20px rgba(37,99,235,0.5);
          transform: translateY(-1px);
        }
        .floating-shape {
          position: absolute;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          animation: float-shape 20s ease-in-out infinite;
        }
        @keyframes float-shape {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-15px) rotate(3deg); }
          66% { transform: translateY(10px) rotate(-2deg); }
        }
        .feature-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(10px);
          transition: background 0.3s, border-color 0.3s, transform 0.3s;
        }
        .feature-card:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
          transform: translateY(-2px);
        }
        .input-focus:focus {
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
          border-color: rgba(59,130,246,0.5) !important;
        }
      `}</style>

      <div className="min-h-screen flex relative overflow-hidden">
        <div className="absolute inset-0 grid-bg"></div>
        <div className="glow-orb w-96 h-96 bg-blue-600 top-20 -left-48" style={{ animationDelay: '0s' }}></div>
        <div className="glow-orb w-80 h-80 bg-indigo-600 bottom-20 right-20" style={{ animationDelay: '3s' }}></div>
        <div className="glow-orb w-64 h-64 bg-cyan-500 top-1/2 left-1/3" style={{ animationDelay: '5s' }}></div>

        <div className="floating-shape w-40 h-40 opacity-30" style={{ top: '15%', left: '10%', animationDelay: '0s' }}></div>
        <div className="floating-shape w-24 h-24 opacity-20" style={{ bottom: '20%', right: '15%', animationDelay: '4s' }}></div>
        <div className="floating-shape w-32 h-32 opacity-15" style={{ top: '60%', left: '60%', animationDelay: '8s' }}></div>

        {/* Left: Branding */}
        <div className="hidden lg:flex lg:w-[55%] relative z-10 items-center justify-center p-12 xl:p-16">
          <div className="max-w-xl animate-in">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Building className="text-white" size={22} />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">{t('app_name')}</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6">
              {isRTL ? 'أهلاً بك في' : 'Welcome to'}<br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {isRTL ? 'نظام إدارة العقارات الاحترافي' : 'Professional Property Management'}
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed mb-12 max-w-md">
              {isRTL
                ? 'منصة متكاملة لإدارة عقاراتك ومستأجريك وعقودك ومدفوعاتك من مكان واحد، بتقارير فورية وتنبيهات ذكية.'
                : 'A complete platform to manage your properties, tenants, contracts and payments in one place with instant reports and smart alerts.'}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Feature icon={PieChart} color="blue" title={t('reports')} desc={isRTL ? 'تقارير مفصلة ورسوم بيانية' : 'Detailed reports & charts'} />
              <Feature icon={ShieldCheck} color="emerald" title={isRTL ? 'أمان عالي' : 'Secure'} desc={isRTL ? 'حماية متقدمة للبيانات' : 'Advanced data protection'} />
              <Feature icon={Zap} color="amber" title={isRTL ? 'أداء سريع' : 'Fast'} desc={isRTL ? 'تجربة سلسة وفورية' : 'Smooth & instant UX'} />
              <Feature icon={Smartphone} color="purple" title={isRTL ? 'متجاوب' : 'Responsive'} desc={isRTL ? 'يعمل على كل الأجهزة' : 'Works on all devices'} />
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-8 relative z-10">
          <div className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'}`}>
            <button data-testid="toggle-language-btn" onClick={toggleLang} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white border border-white/10 hover:border-white/25 rounded-lg transition-colors">
              <Globe size={14} strokeWidth={2} />
              {isRTL ? 'EN' : 'عربي'}
            </button>
          </div>

          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center gap-3 mb-8 animate-in">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Building className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold text-white">{t('app_name')}</span>
            </div>

            <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 sm:p-10 shadow-2xl animate-in animate-in-delay-1">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">{isRTL ? 'مرحباً بعودتك' : 'Welcome back'}</h2>
                <p className="text-sm text-slate-400">{isRTL ? 'سجل دخولك للمتابعة' : 'Sign in to continue'}</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-in">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle className="text-red-400" size={14} />
                    </div>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="animate-in animate-in-delay-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2.5">{t('username')}</label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                      <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
                        <User className="text-blue-300" size={18} strokeWidth={2} />
                      </div>
                    </div>
                    <input
                      data-testid="login-username-input"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoFocus
                      placeholder={isRTL ? 'أدخل اسم المستخدم' : 'Enter your username'}
                      className={`input-focus w-full ${isRTL ? 'pl-4 pr-14' : 'pl-14 pr-4'} py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none text-sm`}
                    />
                  </div>
                </div>

                <div className="animate-in animate-in-delay-3">
                  <label className="block text-sm font-medium text-slate-300 mb-2.5">{t('password')}</label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                        <Lock className="text-indigo-300" size={18} strokeWidth={2} />
                      </div>
                    </div>
                    <input
                      data-testid="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className={`input-focus w-full ${isRTL ? 'pl-14 pr-14' : 'pl-14 pr-14'} py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none text-sm`}
                    />
                    <button data-testid="toggle-password-visibility-btn" type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} inset-y-0 flex items-center`}>
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        {showPassword ? <EyeOff className="text-slate-300" size={18} strokeWidth={2} /> : <Eye className="text-slate-300" size={18} strokeWidth={2} />}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="w-4 h-4 bg-white/5 border-white/20 rounded text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0"
                    />
                    <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">{isRTL ? 'تذكرني' : 'Remember me'}</span>
                  </label>
                </div>

                <button type="submit" disabled={loading} className="btn-brand w-full py-3.5 px-4 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-70">
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span>{t('login')}</span>
                      {isRTL ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-8 text-center animate-in animate-in-delay-3">
              <p className="text-xs text-slate-500">
                &copy; {new Date().getFullYear()} {t('app_name')}. {t('all_rights_reserved')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
