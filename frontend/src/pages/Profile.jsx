import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Edit2, Building2, DoorOpen, Users, FileText, Wallet,
  Receipt, Wrench, UserCog, UsersRound, Zap, Phone, Mail, MapPin, Calendar,
  DollarSign, Hash, CreditCard, Building, Shield, Info, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useCollection } from '../hooks/useCollection';

// Configuration for each resource type
const RESOURCE_CONFIG = {
  owners: { icon: UserCog, gradient: 'from-indigo-500 to-purple-600', tone: 'indigo', backTo: '/owners', titleKey: 'owner' },
  properties: { icon: Building2, gradient: 'from-blue-500 to-indigo-600', tone: 'blue', backTo: '/properties', titleKey: 'property' },
  units: { icon: DoorOpen, gradient: 'from-cyan-500 to-blue-600', tone: 'cyan', backTo: '/units', titleKey: 'unit' },
  tenants: { icon: Users, gradient: 'from-emerald-500 to-teal-600', tone: 'emerald', backTo: '/tenants', titleKey: 'tenant' },
  contracts: { icon: FileText, gradient: 'from-amber-500 to-orange-600', tone: 'amber', backTo: '/contracts', titleKey: 'contract' },
  payments: { icon: Wallet, gradient: 'from-green-500 to-emerald-600', tone: 'green', backTo: '/payments', titleKey: 'payment_date' },
  expenses: { icon: Receipt, gradient: 'from-red-500 to-rose-600', tone: 'red', backTo: '/expenses', titleKey: 'expenses' },
  utility_bills: { icon: Zap, gradient: 'from-amber-500 to-yellow-600', tone: 'amber', backTo: '/utilities', titleKey: 'utility_bills' },
  maintenance: { icon: Wrench, gradient: 'from-orange-500 to-red-600', tone: 'orange', backTo: '/maintenance', titleKey: 'maintenance' },
  users: { icon: UsersRound, gradient: 'from-purple-500 to-pink-600', tone: 'purple', backTo: '/users', titleKey: 'user' },
};

function fmtDate(d) { return d || '-'; }
function fmtNum(n) { if (n == null) return '-'; return new Intl.NumberFormat().format(n); }

export default function Profile() {
  const { resource, id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useApp();
  const isRTL = lang === 'ar';

  const cfg = RESOURCE_CONFIG[resource];
  // Load the collection this item belongs to + any related collections we may need
  const { data: items } = useCollection(resource);
  const { data: owners } = useCollection('owners');
  const { data: properties } = useCollection('properties');
  const { data: units } = useCollection('units');
  const { data: tenants } = useCollection('tenants');
  const { data: contracts } = useCollection('contracts');
  const { data: payments } = useCollection('payments');
  const { data: expenses } = useCollection('expenses');
  const { data: utilityBills } = useCollection('utility_bills');
  const { data: maintenance } = useCollection('maintenance');

  const item = items.find((x) => x.id === id);

  if (!cfg) {
    return <div className="p-8 text-center text-red-500">Unknown resource: {resource}</div>;
  }
  if (!item) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
          <Info className="text-gray-400" size={24} />
        </div>
        <p className="text-gray-500">{t('no_data')}</p>
        <Link to={cfg.backTo} className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-800">← {t('back_to_reports') || t('cancel')}</Link>
      </div>
    );
  }

  const Icon = cfg.icon;

  // Get display name for the header depending on resource
  const displayName = (() => {
    switch (resource) {
      case 'contracts': return item.contract_number;
      case 'payments': return item.reference_number || `${t('payment_date')} ${item.due_date}`;
      case 'expenses': return item.description;
      case 'utility_bills': return item.bill_number || t(item.bill_type === 'electricity' ? 'electricity_bill' : 'water_bill');
      case 'maintenance': return item.title;
      case 'units': return `${t('unit_number')} ${item.unit_number}`;
      default: return item.name;
    }
  })();

  const subtitle = (() => {
    switch (resource) {
      case 'owners': return item.national_id;
      case 'properties': return `${item.city}${item.district ? ' · ' + item.district : ''}`;
      case 'units': {
        const prop = properties.find((p) => p.id === item.property_id);
        return prop?.name || '-';
      }
      case 'tenants': return item.company_name || item.national_id;
      case 'contracts': return tenants.find((x) => x.id === item.tenant_id)?.name || '-';
      case 'payments': return tenants.find((x) => x.id === item.tenant_id)?.name || '-';
      case 'expenses': return properties.find((p) => p.id === item.property_id)?.name || '-';
      case 'utility_bills': return tenants.find((x) => x.id === item.tenant_id)?.name || '-';
      case 'maintenance': return properties.find((p) => p.id === item.property_id)?.name || '-';
      case 'users': return item.username;
      default: return '';
    }
  })();

  // Build detail fields
  const fields = buildProfileFields(resource, item, { owners, properties, units, tenants, contracts, t });

  // Build related sections
  const related = buildRelatedSections(resource, item, {
    owners, properties, units, tenants, contracts, payments, expenses, utilityBills, maintenance, t, lang,
  });

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${cfg.gradient} rounded-2xl p-6 text-white shadow-lg`}>
        <div className="absolute inset-0 opacity-10">
          <svg className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-0 h-full w-1/2`} viewBox="0 0 400 200" fill="none">
            <circle cx="350" cy="50" r="120" fill="white" />
            <circle cx="250" cy="180" r="80" fill="white" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button onClick={() => navigate(cfg.backTo)} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
              {isRTL ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
            </button>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Icon className="text-white" size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white/70 text-xs uppercase tracking-wide font-semibold mb-1">{t(cfg.titleKey)}</p>
              <h1 className="text-xl sm:text-2xl font-bold truncate">{displayName}</h1>
              {subtitle && <p className="text-white/80 text-sm mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to={cfg.backTo} className="px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white rounded-xl font-semibold text-sm transition-all">
              {t('cancel')}
            </Link>
            <button onClick={() => navigate(cfg.backTo, { state: { editId: id } })} className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all">
              <Edit2 size={14} />{t('edit')}
            </button>
          </div>
        </div>
      </div>

      {/* Field grid */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <Info size={16} className={`text-${cfg.tone}-600`} />
          {t('details')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((f, i) => (
            <div key={i} className={`p-4 rounded-xl bg-gray-50/70 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/50 ${f.wide ? 'lg:col-span-2' : ''} ${f.full ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
              <div className="flex items-center gap-2 mb-1.5">
                {f.icon && <f.icon size={12} className="text-gray-400" />}
                <dt className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{f.label}</dt>
              </div>
              <dd className="text-sm font-semibold text-gray-900 dark:text-white break-words">{f.value}</dd>
            </div>
          ))}
        </div>
      </div>

      {/* Related sections */}
      {related.map((sec, si) => (
        <div key={si} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {sec.icon && <sec.icon size={14} className={`text-${sec.tone || 'gray'}-600`} />}
              {sec.title}
              <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{sec.rows.length}</span>
            </h3>
            {sec.linkTo && (
              <Link to={sec.linkTo} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800">
                {t('view_all')} {isRTL ? <ChevronLeft size={11} className="inline" /> : <ChevronRight size={11} className="inline" />}
              </Link>
            )}
          </div>
          <div className="overflow-x-auto">
            {sec.rows.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">{t('no_data')}</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50/50 dark:bg-gray-700/30">
                  <tr>
                    {sec.columns.map((c) => (
                      <th key={c.key} className="text-start px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {sec.rows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                      {sec.columns.map((c) => (
                        <td key={c.key} className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {c.render ? c.render(row) : (row[c.key] == null ? '-' : String(row[c.key]))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function buildProfileFields(resource, item, ctx) {
  const { owners, properties, units, tenants, contracts, t } = ctx;
  const F = (label, value, opts = {}) => ({ label, value: value == null || value === '' ? '-' : value, ...opts });

  switch (resource) {
    case 'owners':
      return [
        F(t('name'), item.name, { icon: UserCog, wide: true }),
        F(t('phone'), item.phone, { icon: Phone }),
        F(t('national_id'), item.national_id, { icon: Hash }),
        F(t('address'), item.address, { icon: MapPin, full: true }),
        F(t('bank_account'), item.bank_account, { icon: CreditCard, wide: true }),
        F(t('status'), <StatusPill status={item.status} map={{ active: { c: 'emerald', l: t('active') }, inactive: { c: 'gray', l: t('inactive') } }} />, { icon: Shield }),
        item.notes && F(t('notes'), item.notes, { full: true }),
      ].filter(Boolean);
    case 'properties':
      return [
        F(t('property_name'), item.name, { icon: Building2 }),
        F(t('owner'), owners.find((o) => o.id === item.owner_id)?.name || '-', { icon: UserCog }),
        F(t('type'), t('property_type_' + item.type), { icon: Building }),
        F(t('city'), item.city, { icon: MapPin }),
        F(t('district'), item.district),
        F(t('total_units'), fmtNum(item.total_units)),
        F(t('address'), item.address, { icon: MapPin, full: true }),
        F(t('land_area'), item.land_area ? `${fmtNum(item.land_area)} m²` : '-'),
        F(t('built_area'), item.built_area ? `${fmtNum(item.built_area)} m²` : '-'),
        F(t('status'), <StatusPill status={item.status} map={{ active: { c: 'emerald', l: t('active') }, inactive: { c: 'gray', l: t('inactive') }, under_maintenance: { c: 'amber', l: t('under_maintenance') } }} />),
        item.notes && F(t('notes'), item.notes, { full: true }),
      ].filter(Boolean);
    case 'units': {
      const prop = properties.find((p) => p.id === item.property_id);
      return [
        F(t('unit_number'), item.unit_number, { icon: DoorOpen }),
        F(t('property'), prop?.name || '-', { icon: Building2 }),
        F(t('floor'), item.floor),
        F(t('area'), `${fmtNum(item.area)} m²`),
        F(t('rooms'), fmtNum(item.rooms)),
        F(t('bathrooms'), fmtNum(item.bathrooms)),
        F(t('rent_price'), `${fmtNum(item.rent_price)} ${t('sar')}`, { icon: DollarSign }),
        F(t('status'), <StatusPill status={item.status} map={{ vacant: { c: 'red', l: t('vacant') }, rented: { c: 'emerald', l: t('rented') }, under_maintenance: { c: 'amber', l: t('under_maintenance') }, reserved: { c: 'blue', l: t('reserved') } }} />),
        item.notes && F(t('notes'), item.notes, { full: true }),
      ].filter(Boolean);
    }
    case 'tenants':
      return [
        F(t('name'), item.name, { icon: Users, wide: true }),
        F(t('phone'), item.phone, { icon: Phone }),
        F(t('national_id'), item.national_id, { icon: Hash }),
        F(t('company_name'), item.company_name, { icon: Building }),
        F(t('address'), item.address, { icon: MapPin, full: true }),
        F(t('status'), <StatusPill status={item.status} map={{ active: { c: 'emerald', l: t('active') }, inactive: { c: 'gray', l: t('inactive') } }} />),
        item.notes && F(t('notes'), item.notes, { full: true }),
      ].filter(Boolean);
    case 'contracts': {
      const unit = units.find((u) => u.id === item.unit_id);
      const prop = unit ? properties.find((p) => p.id === unit.property_id) : null;
      return [
        F(t('contract_number'), item.contract_number, { icon: FileText, wide: true }),
        F(t('tenant'), tenants.find((x) => x.id === item.tenant_id)?.name || '-', { icon: Users }),
        F(t('unit'), unit ? `${prop?.name || ''} - ${unit.unit_number}` : '-', { icon: DoorOpen }),
        F(t('start_date'), fmtDate(item.start_date), { icon: Calendar }),
        F(t('end_date'), fmtDate(item.end_date), { icon: Calendar }),
        F(t('rent_amount'), `${fmtNum(item.rent_amount)} ${t('sar')}`, { icon: DollarSign }),
        F(t('security_deposit'), item.security_deposit ? `${fmtNum(item.security_deposit)} ${t('sar')}` : '-'),
        F(t('payment_frequency'), t(item.payment_frequency || 'monthly')),
        F(t('status'), <StatusPill status={item.status} map={{ active: { c: 'emerald', l: t('active') }, expired: { c: 'gray', l: t('expired') }, cancelled: { c: 'red', l: t('cancelled') }, pending: { c: 'amber', l: t('pending') } }} />),
        item.terms && F(t('notes'), item.terms, { full: true }),
      ].filter(Boolean);
    }
    case 'payments':
      return [
        F(t('reference_number'), item.reference_number, { icon: Hash, wide: true }),
        F(t('amount'), `${fmtNum(item.amount)} ${t('sar')}`, { icon: DollarSign }),
        F(t('tenant'), tenants.find((x) => x.id === item.tenant_id)?.name || '-', { icon: Users }),
        F(t('contract'), contracts.find((x) => x.id === item.contract_id)?.contract_number || '-', { icon: FileText }),
        F(t('type'), t(item.type || 'rent')),
        F(t('payment_method'), t(item.payment_method || 'cash')),
        F(t('due_date'), fmtDate(item.due_date), { icon: Calendar }),
        F(t('payment_date'), fmtDate(item.payment_date), { icon: Calendar }),
        F(t('late_fee'), item.late_fee ? `${fmtNum(item.late_fee)} ${t('sar')}` : '-'),
        F(t('status'), <StatusPill status={item.status} map={{ paid: { c: 'emerald', l: t('paid') }, pending: { c: 'amber', l: t('pending') }, overdue: { c: 'red', l: t('overdue') } }} />),
        item.notes && F(t('notes'), item.notes, { full: true }),
      ].filter(Boolean);
    case 'expenses':
      return [
        F(t('description'), item.description, { icon: Receipt, full: true }),
        F(t('property'), properties.find((p) => p.id === item.property_id)?.name || '-', { icon: Building2 }),
        F(t('category'), t(item.category || 'other')),
        F(t('amount'), `${fmtNum(item.amount)} ${t('sar')}`, { icon: DollarSign }),
        F(t('expense_date'), fmtDate(item.expense_date), { icon: Calendar }),
        F(t('vendor'), item.vendor),
        F(t('reference_number'), item.reference_number),
        F(t('status'), <StatusPill status={item.status} map={{ paid: { c: 'emerald', l: t('paid') }, pending: { c: 'amber', l: t('pending') }, approved: { c: 'blue', l: t('approved') } }} />),
        item.notes && F(t('notes'), item.notes, { full: true }),
      ].filter(Boolean);
    case 'utility_bills': {
      const unit = units.find((u) => u.id === item.unit_id);
      const prop = unit ? properties.find((p) => p.id === unit.property_id) : null;
      return [
        F(t('bill_number'), item.bill_number, { icon: Zap, wide: true }),
        F(t('bill_type'), t(item.bill_type === 'electricity' ? 'electricity_bill' : 'water_bill')),
        F(t('provider'), item.provider),
        F(t('tenant'), tenants.find((x) => x.id === item.tenant_id)?.name || '-', { icon: Users }),
        F(t('unit'), unit ? `${prop?.name || ''} - ${unit.unit_number}` : '-'),
        F(t('period_from'), fmtDate(item.period_from)),
        F(t('period_to'), fmtDate(item.period_to)),
        F(t('previous_reading'), fmtNum(item.previous_reading)),
        F(t('current_reading'), fmtNum(item.current_reading)),
        F(t('consumption'), item.consumption != null ? `${fmtNum(item.consumption)} ${item.bill_type === 'electricity' ? t('kwh') : t('m3')}` : '-'),
        F(t('unit_price'), fmtNum(item.unit_price)),
        F(t('amount'), `${fmtNum(item.amount)} ${t('sar')}`, { icon: DollarSign }),
        F(t('due_date'), fmtDate(item.due_date), { icon: Calendar }),
        F(t('payment_date'), fmtDate(item.payment_date)),
        F(t('status'), <StatusPill status={item.status} map={{ paid: { c: 'emerald', l: t('paid') }, pending: { c: 'amber', l: t('pending') }, overdue: { c: 'red', l: t('overdue') } }} />),
        item.notes && F(t('notes'), item.notes, { full: true }),
      ].filter(Boolean);
    }
    case 'maintenance': {
      const prop = properties.find((p) => p.id === item.property_id);
      const unit = units.find((u) => u.id === item.unit_id);
      return [
        F(t('title'), item.title, { icon: Wrench, full: true }),
        F(t('property'), prop?.name || '-', { icon: Building2 }),
        F(t('unit'), unit?.unit_number || '-'),
        F(t('priority'), <StatusPill status={item.priority} map={{ low: { c: 'gray', l: t('low') }, medium: { c: 'blue', l: t('medium') }, high: { c: 'amber', l: t('high') }, critical: { c: 'red', l: t('critical') } }} />),
        F(t('status'), <StatusPill status={item.status} map={{ pending: { c: 'amber', l: t('pending') }, in_progress: { c: 'blue', l: t('in_progress') }, completed: { c: 'emerald', l: t('completed') }, cancelled: { c: 'gray', l: t('cancelled') } }} />),
        F(t('reported_date'), fmtDate(item.reported_date), { icon: Calendar }),
        F(t('completed_date'), fmtDate(item.completed_date), { icon: Calendar }),
        F(t('cost'), item.cost ? `${fmtNum(item.cost)} ${t('sar')}` : '-'),
        F(t('vendor'), item.vendor),
        F(t('description'), item.description, { full: true }),
        item.notes && F(t('notes'), item.notes, { full: true }),
      ].filter(Boolean);
    }
    case 'users':
      return [
        F(t('name'), item.name, { icon: UsersRound, wide: true }),
        F(t('username'), item.username, { icon: Hash }),
        F(t('email'), item.email, { icon: Mail, wide: true }),
        F(t('role'), <StatusPill status={item.role} map={{ admin: { c: 'purple', l: t('admin') }, user: { c: 'blue', l: t('user') } }} />),
        F(t('status'), <StatusPill status={item.is_active ? 'active' : 'inactive'} map={{ active: { c: 'emerald', l: t('active') }, inactive: { c: 'gray', l: t('inactive') } }} />),
      ];
    default:
      return [];
  }
}

function buildRelatedSections(resource, item, ctx) {
  const { properties, units, tenants, contracts, payments, expenses, utilityBills, maintenance, t } = ctx;
  const list = [];

  if (resource === 'owners') {
    const ownerProps = properties.filter((p) => p.owner_id === item.id);
    list.push({
      title: t('properties'), icon: Building2, tone: 'blue',
      columns: [
        { key: 'name', label: t('property_name') },
        { key: 'type', label: t('type'), render: (r) => t('property_type_' + r.type) },
        { key: 'city', label: t('city') },
        { key: 'total_units', label: t('units'), render: (r) => units.filter((u) => u.property_id === r.id).length || r.total_units },
      ],
      rows: ownerProps,
    });
  }

  if (resource === 'properties') {
    const propUnits = units.filter((u) => u.property_id === item.id);
    list.push({
      title: t('units'), icon: DoorOpen, tone: 'cyan',
      columns: [
        { key: 'unit_number', label: t('unit_number') },
        { key: 'floor', label: t('floor') },
        { key: 'area', label: t('area'), render: (r) => `${r.area} m²` },
        { key: 'rent_price', label: t('rent_price'), render: (r) => fmtNum(r.rent_price) },
        { key: 'status', label: t('status'), render: (r) => t(r.status) },
      ],
      rows: propUnits,
    });
    const propExpenses = expenses.filter((e) => e.property_id === item.id);
    list.push({
      title: t('expenses'), icon: Receipt, tone: 'red',
      columns: [
        { key: 'description', label: t('description') },
        { key: 'category', label: t('category'), render: (r) => t(r.category) },
        { key: 'amount', label: t('amount'), render: (r) => fmtNum(r.amount) },
        { key: 'expense_date', label: t('expense_date') },
      ],
      rows: propExpenses,
    });
  }

  if (resource === 'units') {
    const unitContracts = contracts.filter((c) => c.unit_id === item.id);
    list.push({
      title: t('contracts'), icon: FileText, tone: 'amber',
      columns: [
        { key: 'contract_number', label: t('contract_number') },
        { key: 'tenant_id', label: t('tenant'), render: (r) => tenants.find((x) => x.id === r.tenant_id)?.name || '-' },
        { key: 'start_date', label: t('start_date') },
        { key: 'end_date', label: t('end_date') },
        { key: 'rent_amount', label: t('rent_amount'), render: (r) => fmtNum(r.rent_amount) },
      ],
      rows: unitContracts,
    });
    const unitBills = utilityBills.filter((b) => b.unit_id === item.id);
    list.push({
      title: t('utility_bills'), icon: Zap, tone: 'amber',
      columns: [
        { key: 'bill_number', label: t('bill_number') },
        { key: 'bill_type', label: t('bill_type'), render: (r) => t(r.bill_type === 'electricity' ? 'electricity_bill' : 'water_bill') },
        { key: 'period_from', label: t('period_from') },
        { key: 'amount', label: t('amount'), render: (r) => fmtNum(r.amount) },
        { key: 'status', label: t('status'), render: (r) => t(r.status) },
      ],
      rows: unitBills,
    });
  }

  if (resource === 'tenants') {
    const tenantContracts = contracts.filter((c) => c.tenant_id === item.id);
    list.push({
      title: t('contracts'), icon: FileText, tone: 'amber',
      columns: [
        { key: 'contract_number', label: t('contract_number') },
        { key: 'unit_id', label: t('unit'), render: (r) => units.find((u) => u.id === r.unit_id)?.unit_number || '-' },
        { key: 'start_date', label: t('start_date') },
        { key: 'end_date', label: t('end_date') },
        { key: 'rent_amount', label: t('rent_amount'), render: (r) => fmtNum(r.rent_amount) },
        { key: 'status', label: t('status'), render: (r) => t(r.status) },
      ],
      rows: tenantContracts,
    });
    const tenantPayments = payments.filter((p) => p.tenant_id === item.id);
    list.push({
      title: t('payments'), icon: Wallet, tone: 'green',
      columns: [
        { key: 'reference_number', label: t('reference_number') },
        { key: 'amount', label: t('amount'), render: (r) => fmtNum(r.amount) },
        { key: 'due_date', label: t('due_date') },
        { key: 'payment_date', label: t('payment_date') },
        { key: 'status', label: t('status'), render: (r) => t(r.status) },
      ],
      rows: tenantPayments,
    });
    const tenantBills = utilityBills.filter((b) => b.tenant_id === item.id);
    list.push({
      title: t('utility_bills'), icon: Zap, tone: 'amber',
      columns: [
        { key: 'bill_number', label: t('bill_number') },
        { key: 'bill_type', label: t('bill_type'), render: (r) => t(r.bill_type === 'electricity' ? 'electricity_bill' : 'water_bill') },
        { key: 'amount', label: t('amount'), render: (r) => fmtNum(r.amount) },
        { key: 'status', label: t('status'), render: (r) => t(r.status) },
      ],
      rows: tenantBills,
    });
  }

  if (resource === 'contracts') {
    const contractPayments = payments.filter((p) => p.contract_id === item.id);
    list.push({
      title: t('payments'), icon: Wallet, tone: 'green',
      columns: [
        { key: 'reference_number', label: t('reference_number') },
        { key: 'amount', label: t('amount'), render: (r) => fmtNum(r.amount) },
        { key: 'due_date', label: t('due_date') },
        { key: 'payment_date', label: t('payment_date') },
        { key: 'status', label: t('status'), render: (r) => t(r.status) },
      ],
      rows: contractPayments,
    });
  }

  if (resource === 'properties' || resource === 'units') {
    const propId = resource === 'properties' ? item.id : item.property_id;
    const mnt = maintenance.filter((m) => m.property_id === propId && (resource === 'properties' || m.unit_id === item.id));
    if (mnt.length > 0) {
      list.push({
        title: t('maintenance'), icon: Wrench, tone: 'orange',
        columns: [
          { key: 'title', label: t('title') },
          { key: 'priority', label: t('priority'), render: (r) => t(r.priority) },
          { key: 'reported_date', label: t('reported_date') },
          { key: 'status', label: t('status'), render: (r) => t(r.status) },
        ],
        rows: mnt,
      });
    }
  }

  return list;
}

function StatusPill({ status, map }) {
  const cfg = map[status] || { c: 'gray', l: status };
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${colors[cfg.c] || colors.gray}`}>{cfg.l}</span>;
}
