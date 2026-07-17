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
    const today = new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const durationDays = c.start_date && c.end_date ? Math.max(0, Math.round((new Date(c.end_date) - new Date(c.start_date)) / 86400000)) : 0;
    const durationMonths = Math.round(durationDays / 30);
    const clauses = isRTL ? [
      `يقر الطرف الأول (المالك) بأنه يملك العقار المذكور أعلاه ويحق له تأجيره.`,
      `يقر الطرف الثاني (المستأجر) باستلامه الوحدة بحالة جيدة صالحة للاستخدام.`,
      `مدة العقد ${durationMonths} شهراً ابتداءً من تاريخ ${c.start_date} وحتى ${c.end_date}.`,
      `تكون قيمة الإيجار السنوي (${new Intl.NumberFormat().format(c.rent_amount)} ريال سعودي) تُدفع بواقع ${t(c.payment_frequency || 'monthly')}.`,
      c.security_deposit ? `يدفع المستأجر مبلغ تأمين قدره ${new Intl.NumberFormat().format(c.security_deposit)} ريال سعودي يُرد عند نهاية العقد بعد خصم أي مستحقات.` : null,
      `يلتزم المستأجر بسداد فواتير الكهرباء والمياه والخدمات المرتبطة بالوحدة.`,
      `لا يحق للمستأجر تأجير الوحدة من الباطن دون موافقة خطية من المالك.`,
      `عند إخلاء الوحدة قبل نهاية العقد يخضع الطرف المخالف للشروط النظامية للفسخ.`,
      `في حال التأخر عن السداد يستحق المالك غرامة تأخير حسب اللوائح النافذة.`,
      `أي نزاع ينشأ عن هذا العقد تختص بالنظر فيه المحاكم المختصة بالمملكة العربية السعودية.`,
    ].filter(Boolean) : [
      `The Lessor confirms ownership of the aforementioned property and the right to lease it.`,
      `The Lessee acknowledges receiving the unit in good and usable condition.`,
      `The contract duration is ${durationMonths} months, from ${c.start_date} to ${c.end_date}.`,
      `The annual rent amount is (${new Intl.NumberFormat().format(c.rent_amount)} SAR), paid ${t(c.payment_frequency || 'monthly').toLowerCase()}.`,
      c.security_deposit ? `The Lessee shall pay a security deposit of ${new Intl.NumberFormat().format(c.security_deposit)} SAR, refundable at end of contract after deducting any dues.` : null,
      `The Lessee shall pay all electricity, water, and utility bills related to the unit.`,
      `The Lessee shall not sublet the unit without written approval from the Lessor.`,
      `Early termination is subject to statutory regulations.`,
      `Late payments incur a late fee per applicable regulations.`,
      `Any disputes arising from this contract shall be settled by the competent courts of the Kingdom of Saudi Arabia.`,
    ].filter(Boolean);

    const html = `
      <style>
        .doc-frame { border: 2px solid #1e40af; border-radius: 12px; padding: 28px; margin-top: 8px; }
        .doc-title { text-align: center; margin: 0 0 8px; font-size: 22px; color: #1e3a8a; letter-spacing: 0.5px; }
        .doc-sub { text-align: center; color: #64748b; font-size: 12px; margin-bottom: 20px; }
        .doc-hr { height: 3px; background: linear-gradient(90deg, #1e40af, #4f46e5, #1e40af); border-radius: 2px; margin: 16px 0; }
        .doc-section { margin-top: 18px; }
        .doc-section h3 { font-size: 13px; color: #1e40af; margin: 0 0 10px; padding: 6px 12px; background: #eff6ff; border-radius: 8px; border-inline-start: 3px solid #1e40af; }
        .doc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; padding: 4px 8px; }
        .doc-grid > div { display: flex; gap: 8px; font-size: 12px; padding: 6px 0; border-bottom: 1px dotted #e2e8f0; }
        .doc-grid label { color: #64748b; min-width: 110px; font-weight: 600; }
        .doc-grid span { color: #0f172a; font-weight: 700; flex: 1; }
        .clauses { padding: 0; margin: 0; counter-reset: cnt; list-style: none; }
        .clauses li { position: relative; padding: 8px 0 8px 28px; font-size: 12px; line-height: 1.7; counter-increment: cnt; }
        .clauses li::before { content: counter(cnt); position: absolute; inset-inline-start: 0; top: 6px; width: 20px; height: 20px; background: #1e40af; color: white; border-radius: 50%; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
        html[dir="rtl"] .clauses li { padding: 8px 28px 8px 0; }
        html[dir="rtl"] .clauses li::before { inset-inline-start: auto; inset-inline-end: 0; }
        .sig-block { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        .sig-block .sig { text-align: center; padding: 40px 12px 12px; border: 1px dashed #cbd5e1; border-radius: 10px; }
        .sig-block .sig .role { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .sig-block .sig .name { font-size: 13px; font-weight: 800; color: #0f172a; }
        .sig-block .sig .line { border-top: 1px solid #94a3b8; margin-top: 20px; padding-top: 6px; font-size: 10px; color: #64748b; }
        .stamp-doc { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-radius: 12px; background: linear-gradient(135deg,#1e40af 0%,#4f46e5 100%); color: white; margin-bottom: 6px; }
        .stamp-doc .n { font-size: 11px; opacity: 0.85; }
        .stamp-doc .v { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
        .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 4px; font-weight: 800; color: #92400e; }
      </style>
      <div class="stamp-doc">
        <div>
          <div class="n">${isRTL ? 'رقم العقد' : 'Contract No.'}</div>
          <div class="v">${c.contract_number}</div>
        </div>
        <div style="text-align:end;">
          <div class="n">${isRTL ? 'تاريخ الإصدار' : 'Issue Date'}</div>
          <div class="v" style="font-size:14px;">${today}</div>
        </div>
      </div>
      <div class="doc-frame">
        <h1 class="doc-title">${isRTL ? 'عقد إيجار وحدة عقارية' : 'Real-Estate Rental Contract'}</h1>
        <p class="doc-sub">${isRTL ? 'المملكة العربية السعودية - بسم الله الرحمن الرحيم' : 'Kingdom of Saudi Arabia'}</p>
        <div class="doc-hr"></div>

        <p style="font-size:12px; line-height:1.9; color:#334155; text-align:justify;">
          ${isRTL
            ? `أُبرم هذا العقد في يوم ${today} بين كل من:`
            : `This contract was concluded on ${today} between the following parties:`}
        </p>

        <div class="doc-section">
          <h3>${isRTL ? 'الطرف الأول (المؤجر / المالك)' : 'First Party (Lessor / Owner)'}</h3>
          <div class="doc-grid">
            <div><label>${t('name')}:</label><span>${owner?.name || '-'}</span></div>
            <div><label>${t('national_id')}:</label><span>${owner?.national_id || '-'}</span></div>
            <div><label>${t('phone')}:</label><span>${owner?.phone || '-'}</span></div>
            <div><label>${t('address')}:</label><span>${owner?.address || '-'}</span></div>
          </div>
        </div>

        <div class="doc-section">
          <h3>${isRTL ? 'الطرف الثاني (المستأجر)' : 'Second Party (Lessee / Tenant)'}</h3>
          <div class="doc-grid">
            <div><label>${t('name')}:</label><span>${tenant?.name || '-'}</span></div>
            <div><label>${t('national_id')}:</label><span>${tenant?.national_id || '-'}</span></div>
            <div><label>${t('phone')}:</label><span>${tenant?.phone || '-'}</span></div>
            <div><label>${t('company_name')}:</label><span>${tenant?.company_name || '-'}</span></div>
          </div>
        </div>

        <div class="doc-section">
          <h3>${isRTL ? 'الوحدة موضوع العقد' : 'Rental Unit'}</h3>
          <div class="doc-grid">
            <div><label>${t('property')}:</label><span>${prop?.name || '-'}</span></div>
            <div><label>${t('type')}:</label><span>${prop ? t('property_type_' + prop.type) : '-'}</span></div>
            <div><label>${t('city')}:</label><span>${prop?.city || '-'} ${prop?.district ? '· ' + prop.district : ''}</span></div>
            <div><label>${t('address')}:</label><span>${prop?.address || '-'}</span></div>
            <div><label>${t('unit_number')}:</label><span>${unit?.unit_number || '-'} (${t('floor')}: ${unit?.floor || '-'})</span></div>
            <div><label>${t('area')}:</label><span>${unit?.area || '-'} m²</span></div>
            <div><label>${t('rooms')}:</label><span>${unit?.rooms || 0}</span></div>
            <div><label>${t('bathrooms')}:</label><span>${unit?.bathrooms || 0}</span></div>
          </div>
        </div>

        <div class="doc-section">
          <h3>${isRTL ? 'الشروط المالية' : 'Financial Terms'}</h3>
          <div class="doc-grid">
            <div><label>${t('start_date')}:</label><span class="highlight">${c.start_date}</span></div>
            <div><label>${t('end_date')}:</label><span class="highlight">${c.end_date}</span></div>
            <div><label>${t('rent_amount')}:</label><span class="highlight">${new Intl.NumberFormat().format(c.rent_amount)} ${t('sar')}</span></div>
            <div><label>${t('security_deposit')}:</label><span>${new Intl.NumberFormat().format(c.security_deposit || 0)} ${t('sar')}</span></div>
            <div><label>${t('payment_frequency')}:</label><span>${t(c.payment_frequency || 'monthly')}</span></div>
            <div><label>${isRTL ? 'المدة الإجمالية' : 'Total Duration'}:</label><span>${durationMonths} ${isRTL ? 'شهراً' : 'months'}</span></div>
          </div>
        </div>

        <div class="doc-section">
          <h3>${isRTL ? 'البنود والشروط' : 'Terms & Conditions'}</h3>
          <ol class="clauses">
            ${clauses.map((cl) => `<li>${cl}</li>`).join('')}
          </ol>
        </div>

        ${c.terms ? `
        <div class="doc-section">
          <h3>${isRTL ? 'شروط إضافية' : 'Additional Terms'}</h3>
          <p style="font-size:12px; padding:12px 16px; background:#fef9c3; border-radius:8px; border-inline-start:3px solid #ca8a04; color:#713f12;">${c.terms}</p>
        </div>` : ''}

        <div class="sig-block">
          <div class="sig">
            <div class="role">${isRTL ? 'المؤجر / الطرف الأول' : 'Lessor / First Party'}</div>
            <div class="name">${owner?.name || ''}</div>
            <div class="line">${isRTL ? 'التوقيع والتاريخ' : 'Signature & Date'}</div>
          </div>
          <div class="sig">
            <div class="role">${isRTL ? 'المستأجر / الطرف الثاني' : 'Lessee / Second Party'}</div>
            <div class="name">${tenant?.name || ''}</div>
            <div class="line">${isRTL ? 'التوقيع والتاريخ' : 'Signature & Date'}</div>
          </div>
        </div>
      </div>
      <p style="text-align:center; font-size:10px; color:#94a3b8; margin-top:16px;">
        ${isRTL ? 'هذا العقد صادر من نظام إدارة العقارات' : 'This contract was generated by the Property Management System'}
      </p>
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
