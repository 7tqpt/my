import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Coins, PieChart as PieIcon, AlertTriangle, Hourglass, Clock, ChevronLeft, ChevronRight, Building, Inbox, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useCollection } from '../hooks/useCollection';
import { getDashboard } from '../lib/api';

export default function Dashboard() {
  const { t, user, lang } = useApp();
  const isRTL = lang === 'ar';
  const [dashboard, setDashboard] = useState(null);
  const { data: payments } = useCollection('payments');
  const { data: contracts } = useCollection('contracts');
  const { data: tenants } = useCollection('tenants');
  const { data: properties } = useCollection('properties');
  const { data: units } = useCollection('units');

  useEffect(() => {
    getDashboard().then(setDashboard).catch(() => setDashboard(null));
  }, []);

  const d = dashboard || {
    thisMonthRevenue: 0, thisMonthExpenses: 0, revenueChange: 0, expenseChange: 0,
    totalUnits: 0, rentedUnits: 0, vacantUnits: 0, maintenanceUnits: 0, reservedUnits: 0,
    pendingPayments: 0, overduePayments: 0, expiringContracts: 0,
    monthlyRevenue: Array(12).fill(0), monthlyExpenses: Array(12).fill(0),
  };

  const netProfit = d.thisMonthRevenue - d.thisMonthExpenses;
  const occupancyRate = d.totalUnits ? Math.round((d.rentedUnits / d.totalUnits) * 100) : 0;

  const monthLabels = lang === 'ar'
    ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const chartData = monthLabels.map((m, i) => ({
    month: m,
    revenue: (d.monthlyRevenue || [])[i] || 0,
    expenses: (d.monthlyExpenses || [])[i] || 0,
  }));

  const unitStatusData = [
    { name: t('rented'), value: d.rentedUnits, color: '#10b981' },
    { name: t('vacant'), value: d.vacantUnits, color: '#ef4444' },
    { name: t('under_maintenance'), value: d.maintenanceUnits, color: '#f59e0b' },
  ].filter((x) => x.value > 0);

  const recentPayments = [...payments].reverse().slice(0, 5);
  const recentContracts = [...contracts].reverse().slice(0, 5);

  const topProperties = properties.slice(0, 5).map((p) => {
    const propUnits = units.filter((u) => u.property_id === p.id);
    const rented = propUnits.filter((u) => u.status === 'rented').length;
    const occupancy = propUnits.length ? Math.round((rented / propUnits.length) * 100) : 0;
    const revenue = propUnits.filter((u) => u.status === 'rented').reduce((s, u) => s + (u.rent_price || 0), 0);
    return { ...p, rented_units: rented, total_units_count: propUnits.length || p.total_units, occupancy, revenue };
  });

  const StatCard = ({ icon: Icon, gradient, label, value, badge, badgeColor, alt }) => (
    <div className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="text-white" size={20} />
        </div>
        {badge && (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <p className={`text-3xl font-extrabold tracking-tight ${alt || 'text-gray-900 dark:text-white'}`}>{typeof value === 'number' ? new Intl.NumberFormat().format(value) : value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">{label}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <svg className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-0 h-full w-1/2`} viewBox="0 0 800 400" fill="none">
            <circle cx="600" cy="100" r="200" fill="white"/>
            <circle cx="700" cy="300" r="150" fill="white"/>
            <circle cx="100" cy="200" r="180" fill="white"/>
          </svg>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">{t('welcome_back')} {user?.name} 👋</h1>
            <p className="text-blue-100 text-sm sm:text-base">{t('dashboard_subtitle')}</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-blue-100">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <CalendarDays size={14} />
              <span>{new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} gradient="from-emerald-400 to-emerald-600" value={d.thisMonthRevenue} label={t('this_month_revenue')} badge={d.revenueChange !== 0 ? <><TrendingUp size={9} />{Math.abs(d.revenueChange)}%</> : null} badgeColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard icon={TrendingDown} gradient="from-red-400 to-red-600" value={d.thisMonthExpenses} label={t('this_month_expenses')} badge={d.expenseChange !== 0 ? <><TrendingDown size={9} />{Math.abs(d.expenseChange)}%</> : null} badgeColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard icon={Coins} gradient="from-blue-400 to-blue-600" value={netProfit} label={t('net_profit')} badge={netProfit >= 0 ? t('positive') : t('negative')} badgeColor={netProfit >= 0 ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"} alt={netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} />
        <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <PieIcon className="text-white" size={20} />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">{d.rentedUnits}/{d.totalUnits}</span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{occupancyRate}%</p>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 my-2">
            <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full" style={{ width: `${occupancyRate}%` }} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('occupancy_rate')}</p>
        </div>
      </div>

      {(d.pendingPayments > 0 || d.overduePayments > 0 || d.expiringContracts > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {d.overduePayments > 0 && <AlertCard icon={AlertTriangle} count={d.overduePayments} label={t('overdue_payments')} gradient="from-red-400 to-red-600" borderColor="red" to="/payments" />}
          {d.pendingPayments > 0 && <AlertCard icon={Hourglass} count={d.pendingPayments} label={t('pending_payments')} gradient="from-amber-400 to-amber-600" borderColor="amber" to="/payments" />}
          {d.expiringContracts > 0 && <AlertCard icon={Clock} count={d.expiringContracts} label={t('expiring_contracts')} gradient="from-orange-400 to-orange-600" borderColor="orange" to="/contracts" />}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('revenue_vs_expenses')}</h3>
              <p className="text-xs text-gray-400 mt-1">{new Date().getFullYear()}</p>
            </div>
            <div className="flex items-center gap-5 text-xs font-medium">
              <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><span className="w-3 h-3 rounded-full bg-emerald-500" />{t('revenue')}</span>
              <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><span className="w-3 h-3 rounded-full bg-red-400" />{t('expenses_label')}</span>
            </div>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => new Intl.NumberFormat().format(v)} />
                <Tooltip contentStyle={{ borderRadius: 12 }} formatter={(v) => new Intl.NumberFormat().format(v)} />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6">{t('unit_status_chart')}</h3>
          <div style={{ height: 220 }} className="relative">
            {unitStatusData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={unitStatusData} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                    {unitStatusData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{d.totalUnits}</p>
                <p className="text-[10px] text-gray-400">{t('units')}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            {unitStatusData.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{s.name}</span>
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentList
          title={t('recent_payments')}
          viewAllTo="/payments"
          items={recentPayments.map((p) => ({
            avatar: (tenants.find(x => x.id === p.tenant_id)?.name || '?').charAt(0),
            title: tenants.find(x => x.id === p.tenant_id)?.name || '-',
            subtitle: p.payment_date || p.due_date,
            amount: p.amount,
            status: p.status,
          }))}
          statusColors={{ paid: 'emerald', pending: 'amber', overdue: 'red' }}
          statusLabels={{ paid: t('paid'), pending: t('pending'), overdue: t('overdue') }}
          gradient="from-emerald-400 to-emerald-600"
        />
        <RecentList
          title={t('recent_contracts')}
          viewAllTo="/contracts"
          items={recentContracts.map((c) => {
            const tenant = tenants.find(x => x.id === c.tenant_id);
            const unit = units.find(x => x.id === c.unit_id);
            const prop = unit ? properties.find(x => x.id === unit.property_id) : null;
            return {
              avatar: (tenant?.name || '?').charAt(0),
              title: tenant?.name || '-',
              subtitle: `${prop?.name || ''} - ${unit?.unit_number || ''}`,
              amount: c.rent_amount,
              status: c.status,
            };
          })}
          statusColors={{ active: 'emerald', pending: 'amber', expired: 'gray', cancelled: 'red' }}
          statusLabels={{ active: t('active'), pending: t('pending'), expired: t('expired'), cancelled: t('cancelled') }}
          gradient="from-blue-400 to-blue-600"
        />
      </div>

      {topProperties.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t('top_properties')}</h3>
            <Link to="/properties" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700">{t('view_all')} →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-start px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('property_name')}</th>
                  <th className="text-start px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('type')}</th>
                  <th className="text-start px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('units')}</th>
                  <th className="text-start px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('occupancy_rate')}</th>
                  <th className="text-end px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('revenue')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {topProperties.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center"><Building size={14} className="text-blue-500" /></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</p>
                          <p className="text-[11px] text-gray-400">{p.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5"><span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('property_type_' + p.type)}</span></td>
                    <td className="px-6 py-3.5"><span className="text-sm font-semibold text-gray-900 dark:text-white">{p.rented_units}/{p.total_units_count}</span></td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-20 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${p.occupancy >= 80 ? 'bg-emerald-500' : p.occupancy >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${p.occupancy}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{p.occupancy}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-end">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{new Intl.NumberFormat().format(p.revenue)}</span>
                      <span className="text-[10px] text-gray-400 font-medium ms-1">{t('sar')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AlertCard({ icon: Icon, count, label, gradient, borderColor, to }) {
  const { lang } = useApp();
  return (
    <Link to={to} className={`group flex items-center gap-4 bg-white dark:bg-gray-800 border border-${borderColor}-200 dark:border-${borderColor}-800/50 rounded-2xl p-4 hover:shadow-lg transition-all duration-300`}>
      <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon className="text-white" size={18} />
      </div>
      <div className="flex-1">
        <p className={`text-2xl font-extrabold text-${borderColor}-600 dark:text-${borderColor}-400`}>{count}</p>
        <p className={`text-xs font-medium text-${borderColor}-500 dark:text-${borderColor}-400`}>{label}</p>
      </div>
      {lang === 'ar' ? <ChevronLeft size={16} className={`text-${borderColor}-300`} /> : <ChevronRight size={16} className={`text-${borderColor}-300`} />}
    </Link>
  );
}

function RecentList({ title, viewAllTo, items, statusColors, statusLabels, gradient }) {
  const { t } = useApp();
  const colorClass = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    gray: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
        <Link to={viewAllTo} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700">{t('view_all')} →</Link>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
        {items.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Inbox className="text-gray-400" size={18} />
            </div>
            <p className="text-sm text-gray-400">{t('no_data')}</p>
          </div>
        ) : items.map((it, i) => (
          <div key={i} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                <span className="text-white text-sm font-bold">{it.avatar}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{it.title}</p>
                <p className="text-[11px] text-gray-400">{it.subtitle}</p>
              </div>
            </div>
            <div className="text-end">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{new Intl.NumberFormat().format(it.amount)}</p>
              <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${colorClass[statusColors[it.status]] || colorClass.gray}`}>
                {statusLabels[it.status] || it.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
