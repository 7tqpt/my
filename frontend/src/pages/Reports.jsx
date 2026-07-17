import React, { useState, useEffect } from 'react';
import {
  PieChart as PieIcon, Building2, DoorOpen, TrendingUp, TrendingDown, FileText,
  AlertTriangle, UserCog, Users, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight,
  FileSpreadsheet, FileDown, BarChart3, Wallet, Receipt
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useCollection } from '../hooks/useCollection';
import { getDashboard } from '../lib/api';
import { exportToExcel, printReport, buildTable } from '../lib/export';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

export default function Reports() {
  const { t, lang } = useApp();
  const isRTL = lang === 'ar';
  const [dashboard, setDashboard] = useState(null);
  const [activeReport, setActiveReport] = useState(null);

  const { data: owners } = useCollection('owners');
  const { data: properties } = useCollection('properties');
  const { data: units } = useCollection('units');
  const { data: tenants } = useCollection('tenants');
  const { data: contracts } = useCollection('contracts');
  const { data: payments } = useCollection('payments');
  const { data: expenses } = useCollection('expenses');

  useEffect(() => { getDashboard().then(setDashboard).catch(() => {}); }, []);

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses = expenses.filter(e => e.status === 'paid').reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const rentedUnits = units.filter(u => u.status === 'rented').length;
  const vacantUnits = units.filter(u => u.status === 'vacant').length;
  const occupancyRate = units.length ? Math.round((rentedUnits / units.length) * 100) : 0;

  const overdueCount = payments.filter(p => p.status === 'overdue').length;

  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date(Date.now() + 60 * 86400 * 1000).toISOString().slice(0, 10);
  const expiringContracts = contracts.filter(c => c.status === 'active' && c.end_date && c.end_date >= today && c.end_date <= horizon);

  const monthLabels = isRTL
    ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const mr = dashboard?.monthlyRevenue || Array(12).fill(0);
  const me = dashboard?.monthlyExpenses || Array(12).fill(0);
  const chartData = monthLabels.map((m, i) => ({ month: m, revenue: mr[i], expenses: me[i] }));

  const propTypeData = ['residential', 'commercial', 'industrial', 'administrative'].map((type) => ({
    name: t('property_type_' + type),
    value: properties.filter(p => p.type === type).length,
  })).filter(x => x.value > 0);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981'];

  const nf = (v) => new Intl.NumberFormat().format(v || 0);

  const REPORT_CATEGORIES = [
    {
      id: 'revenue', title: t('revenue_report'), desc: t('revenue_report_desc'),
      icon: TrendingUp, gradient: 'from-emerald-400 to-emerald-600', tone: 'emerald',
      value: `${nf(totalRevenue)} ${t('sar')}`,
    },
    {
      id: 'expenses', title: t('expenses_report'), desc: t('expenses_report_desc'),
      icon: Receipt, gradient: 'from-red-400 to-red-600', tone: 'red',
      value: `${nf(totalExpenses)} ${t('sar')}`,
    },
    {
      id: 'overdue', title: t('overdue_payments'), desc: t('overdue_payments_desc'),
      icon: AlertTriangle, gradient: 'from-orange-400 to-orange-600', tone: 'orange',
      value: `${overdueCount} ${t('payments')}`,
    },
    {
      id: 'expiring', title: t('expiring_contracts'), desc: t('expiring_contracts_desc'),
      icon: FileText, gradient: 'from-amber-400 to-amber-600', tone: 'amber',
      value: `${expiringContracts.length} ${t('contracts')}`,
    },
    {
      id: 'vacant', title: t('vacant_units'), desc: t('vacant_units_desc'),
      icon: DoorOpen, gradient: 'from-purple-400 to-purple-600', tone: 'purple',
      value: `${vacantUnits} ${t('units')}`,
    },
    {
      id: 'owners', title: t('owner_performance'), desc: t('owner_performance_desc'),
      icon: UserCog, gradient: 'from-blue-400 to-blue-600', tone: 'blue',
      value: `${owners.length} ${t('owners')}`,
    },
    {
      id: 'tenant_monthly', title: t('tenant_monthly'), desc: t('tenant_monthly_desc'),
      icon: Users, gradient: 'from-indigo-400 to-indigo-600', tone: 'indigo',
      value: `${tenants.length} ${t('tenants')}`,
    },
  ];

  // ---------- Report data builders ----------
  const reportBuilders = {
    revenue: () => {
      const rows = payments.filter(p => p.status === 'paid').map((p) => {
        const tenant = tenants.find(x => x.id === p.tenant_id);
        const contract = contracts.find(x => x.id === p.contract_id);
        return {
          reference: p.reference_number || '-',
          tenant: tenant?.name || '-',
          contract: contract?.contract_number || '-',
          amount: p.amount, date: p.payment_date, method: t(p.payment_method || 'cash'),
          type: t(p.type || 'rent'),
        };
      });
      return {
        title: t('revenue_report'),
        columns: [
          { key: 'reference', label: t('reference_number') },
          { key: 'tenant', label: t('tenant') },
          { key: 'contract', label: t('contract') },
          { key: 'type', label: t('type') },
          { key: 'method', label: t('payment_method') },
          { key: 'date', label: t('payment_date') },
          { key: 'amount', label: t('amount'), value: (r) => nf(r.amount) },
        ],
        rows,
        totals: [{ label: t('total') + ' ' + t('revenue'), value: `${nf(rows.reduce((s, r) => s + r.amount, 0))} ${t('sar')}`, color: 'emerald' }],
      };
    },
    expenses: () => {
      const rows = expenses.map((e) => {
        const prop = properties.find(p => p.id === e.property_id);
        return {
          description: e.description,
          category: t(e.category || 'other'),
          property: prop?.name || '-',
          vendor: e.vendor || '-',
          date: e.expense_date, amount: e.amount, status: t(e.status || 'pending'),
        };
      });
      return {
        title: t('expenses_report'),
        columns: [
          { key: 'description', label: t('description') },
          { key: 'category', label: t('category') },
          { key: 'property', label: t('property') },
          { key: 'vendor', label: t('vendor') },
          { key: 'date', label: t('expense_date') },
          { key: 'status', label: t('status') },
          { key: 'amount', label: t('amount'), value: (r) => nf(r.amount) },
        ],
        rows,
        totals: [{ label: t('total') + ' ' + t('expenses_label'), value: `${nf(rows.reduce((s, r) => s + r.amount, 0))} ${t('sar')}`, color: 'red' }],
      };
    },
    overdue: () => {
      const rows = payments.filter(p => p.status === 'overdue').map((p) => ({
        tenant: tenants.find(x => x.id === p.tenant_id)?.name || '-',
        contract: contracts.find(x => x.id === p.contract_id)?.contract_number || '-',
        amount: p.amount,
        due_date: p.due_date,
        late_fee: p.late_fee || 0,
        total: (p.amount || 0) + (p.late_fee || 0),
      }));
      return {
        title: t('overdue_payments'),
        columns: [
          { key: 'tenant', label: t('tenant') },
          { key: 'contract', label: t('contract') },
          { key: 'due_date', label: t('due_date') },
          { key: 'amount', label: t('amount'), value: (r) => nf(r.amount) },
          { key: 'late_fee', label: t('late_fee'), value: (r) => nf(r.late_fee) },
          { key: 'total', label: t('total'), value: (r) => nf(r.total) },
        ],
        rows,
        totals: [{ label: t('total'), value: `${nf(rows.reduce((s, r) => s + r.total, 0))} ${t('sar')}`, color: 'red' }],
      };
    },
    expiring: () => {
      const rows = expiringContracts.map((c) => {
        const tenant = tenants.find(x => x.id === c.tenant_id);
        const unit = units.find(x => x.id === c.unit_id);
        const prop = unit ? properties.find(x => x.id === unit.property_id) : null;
        const days = Math.max(0, Math.round((new Date(c.end_date) - new Date()) / 86400000));
        return {
          contract_number: c.contract_number,
          tenant: tenant?.name || '-',
          unit: unit ? `${prop?.name || ''} - ${unit.unit_number}` : '-',
          start_date: c.start_date, end_date: c.end_date,
          days_left: days, rent_amount: c.rent_amount,
        };
      });
      return {
        title: t('expiring_contracts'),
        columns: [
          { key: 'contract_number', label: t('contract_number') },
          { key: 'tenant', label: t('tenant') },
          { key: 'unit', label: t('unit') },
          { key: 'start_date', label: t('start_date') },
          { key: 'end_date', label: t('end_date') },
          { key: 'days_left', label: isRTL ? 'أيام متبقية' : 'Days left' },
          { key: 'rent_amount', label: t('rent_amount'), value: (r) => nf(r.rent_amount) },
        ],
        rows,
      };
    },
    vacant: () => {
      const rows = units.filter(u => u.status === 'vacant').map((u) => {
        const prop = properties.find(p => p.id === u.property_id);
        return {
          unit_number: u.unit_number,
          property: prop?.name || '-',
          city: prop?.city || '-',
          floor: u.floor || '-',
          area: u.area, rooms: u.rooms, bathrooms: u.bathrooms,
          rent_price: u.rent_price,
        };
      });
      return {
        title: t('vacant_units'),
        columns: [
          { key: 'unit_number', label: t('unit_number') },
          { key: 'property', label: t('property') },
          { key: 'city', label: t('city') },
          { key: 'floor', label: t('floor') },
          { key: 'area', label: t('area') },
          { key: 'rooms', label: t('rooms') },
          { key: 'bathrooms', label: t('bathrooms') },
          { key: 'rent_price', label: t('rent_price'), value: (r) => nf(r.rent_price) },
        ],
        rows,
        totals: [{ label: isRTL ? 'إيرادات محتملة' : 'Potential Revenue', value: `${nf(rows.reduce((s, r) => s + r.rent_price, 0))} ${t('sar')}`, color: 'purple' }],
      };
    },
    owners: () => {
      const rows = owners.map((o) => {
        const ownerProps = properties.filter(p => p.owner_id === o.id);
        const ownerUnits = units.filter(u => ownerProps.find(p => p.id === u.property_id));
        const rented = ownerUnits.filter(u => u.status === 'rented');
        const revenue = rented.reduce((s, u) => s + (u.rent_price || 0), 0);
        const occ = ownerUnits.length ? Math.round((rented.length / ownerUnits.length) * 100) : 0;
        return {
          name: o.name, phone: o.phone,
          properties_count: ownerProps.length,
          units_count: ownerUnits.length,
          rented_count: rented.length,
          occupancy: `${occ}%`,
          revenue,
        };
      });
      return {
        title: t('owner_performance'),
        columns: [
          { key: 'name', label: t('name') },
          { key: 'phone', label: t('phone') },
          { key: 'properties_count', label: t('properties') },
          { key: 'units_count', label: t('total_units') },
          { key: 'rented_count', label: t('rented') },
          { key: 'occupancy', label: t('occupancy_rate') },
          { key: 'revenue', label: t('revenue'), value: (r) => nf(r.revenue) },
        ],
        rows,
        totals: [{ label: t('total') + ' ' + t('revenue'), value: `${nf(rows.reduce((s, r) => s + r.revenue, 0))} ${t('sar')}`, color: 'emerald' }],
      };
    },
    tenant_monthly: () => {
      const rows = tenants.map((tn) => {
        const tenantContracts = contracts.filter(c => c.tenant_id === tn.id);
        const tenantPayments = payments.filter(p => p.tenant_id === tn.id);
        const totalPaid = tenantPayments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
        const totalPending = tenantPayments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);
        const totalOverdue = tenantPayments.filter(p => p.status === 'overdue').reduce((s, p) => s + (p.amount || 0), 0);
        return {
          name: tn.name, phone: tn.phone,
          contracts_count: tenantContracts.length,
          payments_count: tenantPayments.length,
          paid: totalPaid,
          pending: totalPending,
          overdue: totalOverdue,
        };
      });
      return {
        title: t('tenant_monthly'),
        columns: [
          { key: 'name', label: t('tenant') },
          { key: 'phone', label: t('phone') },
          { key: 'contracts_count', label: t('contracts') },
          { key: 'payments_count', label: t('payments') },
          { key: 'paid', label: t('paid'), value: (r) => nf(r.paid) },
          { key: 'pending', label: t('pending'), value: (r) => nf(r.pending) },
          { key: 'overdue', label: t('overdue'), value: (r) => nf(r.overdue) },
        ],
        rows,
        totals: [
          { label: t('paid'), value: `${nf(rows.reduce((s, r) => s + r.paid, 0))} ${t('sar')}`, color: 'emerald' },
          { label: t('pending'), value: `${nf(rows.reduce((s, r) => s + r.pending, 0))} ${t('sar')}`, color: 'amber' },
          { label: t('overdue'), value: `${nf(rows.reduce((s, r) => s + r.overdue, 0))} ${t('sar')}`, color: 'red' },
        ],
      };
    },
  };

  const current = activeReport ? reportBuilders[activeReport]() : null;
  const currentCat = activeReport ? REPORT_CATEGORIES.find((c) => c.id === activeReport) : null;

  const doExportExcel = () => {
    if (!current) return;
    const date = new Date().toISOString().slice(0, 10);
    exportToExcel(`${activeReport}_report_${date}.xlsx`, current.rows, current.columns, current.title);
  };

  const doExportPDF = () => {
    if (!current) return;
    const totalsHtml = current.totals ? `
      <table style="margin-top:16px;">
        <thead><tr>${current.totals.map((t) => `<th>${t.label}</th>`).join('')}</tr></thead>
        <tbody><tr class="tot">${current.totals.map((t) => `<td>${t.value}</td>`).join('')}</tr></tbody>
      </table>` : '';
    const html = `
      <div class="stamp">
        <div>
          <div class="label">${t('reports')}</div>
          <div style="font-size:20px; font-weight:800;">${current.title}</div>
        </div>
        <div style="text-align:end;">
          <div class="label">${new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <div class="value">${current.rows.length} ${isRTL ? 'سجل' : 'records'}</div>
        </div>
      </div>
      <h1>${current.title}</h1>
      <p class="subtitle">${current.rows.length} ${isRTL ? 'سجل' : 'records'}</p>
      ${buildTable(current.columns, current.rows)}
      ${totalsHtml}
    `;
    printReport(current.title, html, { dir: isRTL ? 'rtl' : 'ltr', lang });
  };

  // Show a specific report view when activeReport is set
  if (activeReport && current) {
    return (
      <div className="space-y-6">
        <div className={`relative overflow-hidden bg-gradient-to-br ${currentCat.gradient} rounded-2xl p-6 text-white shadow-lg`}>
          <div className="absolute inset-0 opacity-10">
            <svg className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-0 h-full w-1/2`} viewBox="0 0 400 200" fill="none">
              <circle cx="350" cy="50" r="120" fill="white" />
            </svg>
          </div>
          <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveReport(null)} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
                {isRTL ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
              </button>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <currentCat.icon size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{current.title}</h1>
                <p className="text-white/80 text-sm">{currentCat.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={doExportExcel} className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-700 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
                <FileSpreadsheet size={16} />{t('export_excel')}
              </button>
              <button onClick={doExportPDF} className="flex items-center gap-2 px-4 py-2.5 bg-white text-red-700 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
                <FileDown size={16} />{t('export_pdf')}
              </button>
            </div>
          </div>
        </div>

        {current.totals && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {current.totals.map((tot, i) => {
              const toneClass = {
                emerald: 'from-emerald-400 to-emerald-600',
                red: 'from-red-400 to-red-600',
                amber: 'from-amber-400 to-amber-600',
                blue: 'from-blue-400 to-blue-600',
                purple: 'from-purple-400 to-purple-600',
              }[tot.color] || 'from-gray-400 to-gray-600';
              return (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${toneClass} flex items-center justify-center mb-3 shadow-md`}>
                    <BarChart3 className="text-white" size={18} />
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{tot.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">{tot.label}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  {current.columns.map((col) => (
                    <th key={col.key} className="text-start px-6 py-3.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {current.rows.length === 0 ? (
                  <tr><td colSpan={current.columns.length} className="px-6 py-12 text-center text-sm text-gray-400">{t('no_data')}</td></tr>
                ) : current.rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                    {current.columns.map((col) => (
                      <td key={col.key} className="px-6 py-3.5 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {col.value ? col.value(r) : (r[col.key] == null ? '-' : String(r[col.key]))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Reports index (default view)
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <svg className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-0 h-full w-1/2`} viewBox="0 0 400 200" fill="none">
            <circle cx="350" cy="50" r="120" fill="white" />
            <circle cx="250" cy="180" r="80" fill="white" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center"><BarChart3 size={24} /></div>
          <div>
            <h1 className="text-2xl font-bold">{t('reports')}</h1>
            <p className="text-white/80 text-sm">{isRTL ? 'تقارير شاملة وتحليلات متقدمة' : 'Comprehensive reports & advanced analytics'}</p>
          </div>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Building2} gradient="from-blue-400 to-blue-600" label={t('total_properties')} value={nf(properties.length)} badge={`${occupancyRate}%`} badgeColor="emerald" />
        <KpiCard icon={DoorOpen} gradient="from-emerald-400 to-emerald-600" label={t('total_units')} value={nf(units.length)} badge={`${rentedUnits}/${units.length}`} badgeColor="gray" />
        <KpiCard icon={TrendingUp} gradient="from-green-400 to-green-600" label={t('revenue')} value={nf(totalRevenue)} colored="text-emerald-600 dark:text-emerald-400" />
        <KpiCard icon={Wallet} gradient={netProfit >= 0 ? 'from-emerald-400 to-emerald-600' : 'from-red-400 to-red-600'} label={t('net_profit')} value={nf(netProfit)} colored={netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <BarChart3 className="text-white" size={16} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('revenue_trend')}</h3>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => nf(v)} />
                <Tooltip formatter={(v) => nf(v)} contentStyle={{ borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} name={t('revenue')} />
                <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} name={t('expenses_label')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <PieIcon className="text-white" size={16} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('property_report')}</h3>
          </div>
          <div style={{ height: 280 }}>
            {propTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={propTypeData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value" label={(entry) => `${entry.name}: ${entry.value}`}>
                    {propTypeData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">{t('no_data')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Report Cards Grid - matches original */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveReport(cat.id)}
              className={`group text-start bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md hover:border-${cat.tone}-300 dark:hover:border-${cat.tone}-700 transition-all`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="text-white" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 dark:text-white text-sm">{cat.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{cat.desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                <span className={`text-sm font-bold text-${cat.tone}-600 dark:text-${cat.tone}-400`}>{cat.value}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  {t('view')}
                  {isRTL ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, gradient, label, value, badge, badgeColor = 'gray', colored }) {
  const badgeCls = {
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
    gray: 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
  }[badgeColor] || 'text-gray-500 bg-gray-100';
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="text-white" size={18} />
        </div>
        {badge != null && <span className={`text-xs font-bold ${badgeCls} px-2 py-0.5 rounded-full`}>{badge}</span>}
      </div>
      <p className={`text-2xl font-extrabold ${colored || 'text-gray-900 dark:text-white'}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">{label}</p>
    </div>
  );
}
