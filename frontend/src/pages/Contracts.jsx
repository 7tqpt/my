import React from 'react';
import { FileText, FileDown } from 'lucide-react';
import CrudTable, { StatusBadge } from '../components/CrudTable';
import { useApp } from '../context/AppContext';
import { useCollection } from '../hooks/useCollection';
import { printReport } from '../lib/export';

export default function Contracts() {
  const { t, lang } = useApp();
  const isRTL = lang === 'ar';
  const { data, setData } = useCollection('contracts');
  const { data: tenants } = useCollection('tenants');
  const { data: units } = useCollection('units');
  const { data: properties } = useCollection('properties');
  const { data: owners } = useCollection('owners');

  const nf = (v) => new Intl.NumberFormat().format(v || 0);

  const exportContractPDF = (c) => {
    const tenant = tenants.find(x => x.id === c.tenant_id);
    const unit = units.find(x => x.id === c.unit_id);
    const prop = unit ? properties.find(x => x.id === unit.property_id) : null;
    const owner = prop ? owners.find(o => o.id === prop.owner_id) : null;
    const html = `
      <div class="stamp">
        <div>
          <div class="label">${t('contract')}</div>
          <div style="font-size:22px; font-weight:800;">${c.contract_number}</div>
        </div>
        <div style="text-align:end;">
          <div class="label">${t('rent_amount')}</div>
          <div class="value">${nf(c.rent_amount)} ${t('sar')}</div>
        </div>
      </div>
      <h1>${isRTL ? 'عقد إيجار' : 'Rental Contract'}</h1>
      <p class="subtitle">${t('contract_number')}: ${c.contract_number}</p>
      <h3 style="margin-top:20px; font-size:14px;">${isRTL ? 'أطراف العقد' : 'Parties'}</h3>
      <table>
        <tbody>
          <tr><td class="tot" style="width:30%;">${t('owner')}</td><td>${owner?.name || '-'}</td></tr>
          <tr><td class="tot">${t('phone')} (${t('owner')})</td><td>${owner?.phone || '-'}</td></tr>
          <tr><td class="tot">${t('tenant')}</td><td>${tenant?.name || '-'}</td></tr>
          <tr><td class="tot">${t('phone')} (${t('tenant')})</td><td>${tenant?.phone || '-'}</td></tr>
          <tr><td class="tot">${t('national_id')} (${t('tenant')})</td><td>${tenant?.national_id || '-'}</td></tr>
        </tbody>
      </table>
      <h3 style="margin-top:20px; font-size:14px;">${isRTL ? 'موضوع العقد' : 'Property Subject'}</h3>
      <table>
        <tbody>
          <tr><td class="tot" style="width:30%;">${t('property')}</td><td>${prop?.name || '-'}</td></tr>
          <tr><td class="tot">${t('address')}</td><td>${prop?.address || '-'}</td></tr>
          <tr><td class="tot">${t('unit_number')}</td><td>${unit?.unit_number || '-'} (${t('floor')}: ${unit?.floor || '-'})</td></tr>
          <tr><td class="tot">${t('area')}</td><td>${unit?.area || '-'} m²</td></tr>
        </tbody>
      </table>
      <h3 style="margin-top:20px; font-size:14px;">${isRTL ? 'شروط الإيجار' : 'Rental Terms'}</h3>
      <table>
        <tbody>
          <tr><td class="tot" style="width:30%;">${t('start_date')}</td><td>${c.start_date}</td></tr>
          <tr><td class="tot">${t('end_date')}</td><td>${c.end_date}</td></tr>
          <tr><td class="tot">${t('rent_amount')}</td><td>${nf(c.rent_amount)} ${t('sar')}</td></tr>
          <tr><td class="tot">${t('security_deposit')}</td><td>${nf(c.security_deposit)} ${t('sar')}</td></tr>
          <tr><td class="tot">${t('payment_frequency')}</td><td>${t(c.payment_frequency || 'monthly')}</td></tr>
          <tr><td class="tot">${t('status')}</td><td>${t(c.status)}</td></tr>
        </tbody>
      </table>
      ${c.terms ? `<h3 style="margin-top:20px; font-size:14px;">${t('notes')}</h3><p style="padding:12px; background:#f9fafb; border-radius:8px; font-size:12px;">${c.terms}</p>` : ''}
      <div style="margin-top:40px; display:flex; justify-content:space-between; gap:20px;">
        <div style="text-align:center; flex:1;"><div style="border-top:1px solid #333; padding-top:8px; font-size:11px; color:#666;">${t('owner')}<br/><b>${owner?.name || ''}</b></div></div>
        <div style="text-align:center; flex:1;"><div style="border-top:1px solid #333; padding-top:8px; font-size:11px; color:#666;">${t('tenant')}<br/><b>${tenant?.name || ''}</b></div></div>
      </div>
    `;
    printReport(`${isRTL ? 'عقد' : 'Contract'} ${c.contract_number}`, html, { dir: isRTL ? 'rtl' : 'ltr', lang });
  };

  const freqOpts = [
    { value: 'monthly', label: t('monthly') },
    { value: 'quarterly', label: t('quarterly') },
    { value: 'semi_annual', label: t('semi_annual') },
    { value: 'annual', label: t('annual') },
  ];

  const statusOpts = [
    { value: 'active', label: t('active') },
    { value: 'expired', label: t('expired') },
    { value: 'cancelled', label: t('cancelled') },
    { value: 'pending', label: t('pending') },
  ];

  const columns = [
    { key: 'contract_number', label: t('contract_number'), render: (r) => (
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
          <FileText size={14} className="text-amber-600" />
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-white font-mono">{r.contract_number}</span>
      </div>
    )},
    { key: 'tenant_id', label: t('tenant'), render: (r) => tenants.find(x => x.id === r.tenant_id)?.name || '-' },
    { key: 'unit_id', label: t('unit'), render: (r) => {
      const u = units.find(x => x.id === r.unit_id);
      const p = u ? properties.find(x => x.id === u.property_id) : null;
      return u ? `${p?.name || ''} - ${u.unit_number}` : '-';
    }},
    { key: 'start_date', label: t('start_date') },
    { key: 'end_date', label: t('end_date') },
    { key: 'rent_amount', label: t('rent_amount'), render: (r) => (
      <span className="font-semibold text-gray-900 dark:text-white">{new Intl.NumberFormat().format(r.rent_amount)}</span>
    )},
    { key: 'payment_frequency', label: t('payment_frequency'), render: (r) => <span className="text-xs text-gray-600 dark:text-gray-400">{t(r.payment_frequency)}</span> },
    { key: 'status', label: t('status'), render: (r) => <StatusBadge status={r.status} colorMap={{
      active: { color: 'green', label: t('active') },
      expired: { color: 'gray', label: t('expired') },
      cancelled: { color: 'red', label: t('cancelled') },
      pending: { color: 'amber', label: t('pending') },
    }} /> },
  ];

  const fields = [
    { name: 'contract_number', label: t('contract_number'), type: 'text', required: true },
    { name: 'tenant_id', label: t('tenant'), type: 'select', required: true, options: tenants.map(x => ({ value: x.id, label: x.name })) },
    { name: 'unit_id', label: t('unit'), type: 'select', required: true, options: units.map(u => {
      const p = properties.find(x => x.id === u.property_id);
      return { value: u.id, label: `${p?.name || ''} - ${u.unit_number}` };
    }), colSpan: 2 },
    { name: 'start_date', label: t('start_date'), type: 'date', required: true },
    { name: 'end_date', label: t('end_date'), type: 'date', required: true },
    { name: 'rent_amount', label: t('rent_amount'), type: 'number', required: true },
    { name: 'security_deposit', label: t('security_deposit'), type: 'number' },
    { name: 'payment_frequency', label: t('payment_frequency'), type: 'select', required: true, options: freqOpts },
    { name: 'status', label: t('status'), type: 'select', required: true, options: statusOpts },
    { name: 'terms', label: t('notes'), type: 'textarea', colSpan: 2 },
  ];

  return (
    <CrudTable
      title={t('contracts')}
      icon={FileText}
      color="amber"
      resource="contracts"
      data={data}
      setData={setData}
      columns={columns}
      fields={fields}
      searchKeys={['contract_number', 'terms']}
      extraActions={(row) => (
        <button
          onClick={() => exportContractPDF(row)}
          title={t('export_pdf')}
          className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
        >
          <FileDown size={14} />
        </button>
      )}
      filters={[
        { key: 'status', label: t('status'), options: statusOpts },
        { key: 'payment_frequency', label: t('payment_frequency'), options: freqOpts },
      ]}
    />
  );
}
