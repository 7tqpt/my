import React from 'react';
import { Zap } from 'lucide-react';
import CrudTable, { StatusBadge } from '../components/CrudTable';
import { useApp } from '../context/AppContext';
import { useCollection } from '../hooks/useCollection';

export default function UtilityBills() {
  const { t, lang } = useApp();
  const isRTL = lang === 'ar';
  const { data, setData } = useCollection('utility_bills');
  const { data: tenants } = useCollection('tenants');
  const { data: units } = useCollection('units');
  const { data: properties } = useCollection('properties');

  const billTypeOpts = [
    { value: 'electricity', label: t('electricity_bill') },
    { value: 'water', label: t('water_bill') },
  ];
  const statusOpts = [
    { value: 'pending', label: t('pending') },
    { value: 'paid', label: t('paid') },
    { value: 'overdue', label: t('overdue') },
  ];
  const methodOpts = [
    { value: 'cash', label: t('cash') },
    { value: 'bank_transfer', label: t('bank_transfer') },
    { value: 'card', label: t('card') },
    { value: 'check', label: t('check') },
  ];

  const columns = [
    { key: 'bill_number', label: t('bill_number'), render: (r) => (
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-lg ${r.bill_type === 'electricity' ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-cyan-50 dark:bg-cyan-900/30'} flex items-center justify-center`}>
          <Zap size={14} className={r.bill_type === 'electricity' ? 'text-amber-600' : 'text-cyan-600'} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">{r.bill_number || '-'}</p>
          <p className="text-[11px] text-gray-400">{t(r.bill_type === 'electricity' ? 'electricity_bill' : 'water_bill')}</p>
        </div>
      </div>
    )},
    { key: 'tenant_id', label: t('tenant'), render: (r) => tenants.find(x => x.id === r.tenant_id)?.name || '-' },
    { key: 'unit_id', label: t('unit'), render: (r) => {
      const u = units.find(x => x.id === r.unit_id);
      const p = u ? properties.find(x => x.id === u.property_id) : null;
      return u ? `${p?.name || ''} - ${u.unit_number}` : '-';
    }},
    { key: 'period_from', label: t('billing_period'), render: (r) => (
      <span className="text-xs text-gray-600 dark:text-gray-400">{r.period_from} → {r.period_to}</span>
    )},
    { key: 'consumption', label: t('consumption'), render: (r) => {
      if (r.consumption == null) return '-';
      const unitLabel = r.bill_type === 'electricity' ? t('kwh') : t('m3');
      return <span className="text-sm font-semibold text-gray-900 dark:text-white">{new Intl.NumberFormat().format(r.consumption)} <span className="text-[10px] text-gray-400">{unitLabel}</span></span>;
    }},
    { key: 'amount', label: t('amount'), render: (r) => (
      <span className="font-bold text-gray-900 dark:text-white">{new Intl.NumberFormat().format(r.amount)} <span className="text-[10px] text-gray-400">{t('sar')}</span></span>
    )},
    { key: 'due_date', label: t('due_date') },
    { key: 'status', label: t('status'), render: (r) => <StatusBadge status={r.status} colorMap={{
      paid: { color: 'green', label: t('paid') },
      pending: { color: 'amber', label: t('pending') },
      overdue: { color: 'red', label: t('overdue') },
    }} /> },
  ];

  const secBill = isRTL ? '📋 معلومات الفاتورة' : '📋 Bill Information';
  const secParty = isRTL ? '👤 المستأجر والوحدة' : '👤 Tenant & Unit';
  const secPeriod = isRTL ? '📅 فترة الفوترة' : '📅 Billing Period';
  const secReadings = isRTL ? '⚡ القراءات والاستهلاك' : '⚡ Readings & Consumption';
  const secPayment = isRTL ? '💰 الدفع والحالة' : '💰 Payment & Status';

  const fields = [
    // Bill Identification section
    { section: secBill, name: 'bill_type', label: t('bill_type'), type: 'select', required: true, options: billTypeOpts },
    { section: secBill, name: 'provider', label: t('provider'), type: 'text', placeholder: 'SEC / NWC', hint: isRTL ? 'الشركة السعودية للكهرباء / المياه الوطنية' : 'Electric / Water provider' },
    { section: secBill, name: 'bill_number', label: t('bill_number'), type: 'text', placeholder: 'ELEC-XXXX / WTR-XXXX', colSpan: 2 },
    // Party / Location
    { section: secParty, name: 'unit_id', label: t('unit'), type: 'select', required: true, options: units.map(u => {
      const p = properties.find(x => x.id === u.property_id);
      return { value: u.id, label: `${p?.name || ''} - ${u.unit_number}` };
    })},
    { section: secParty, name: 'tenant_id', label: t('tenant'), type: 'select', required: true, options: tenants.map(x => ({ value: x.id, label: x.name })) },
    // Billing Period
    { section: secPeriod, name: 'period_from', label: t('period_from'), type: 'date', required: true },
    { section: secPeriod, name: 'period_to', label: t('period_to'), type: 'date', required: true },
    { section: secPeriod, name: 'issue_date', label: t('issue_date'), type: 'date', required: true },
    { section: secPeriod, name: 'due_date', label: t('due_date'), type: 'date', required: true },
    // Readings
    { section: secReadings, name: 'previous_reading', label: t('previous_reading'), type: 'number', placeholder: isRTL ? 'مثال: 1200' : 'e.g. 1200' },
    { section: secReadings, name: 'current_reading', label: t('current_reading'), type: 'number', placeholder: isRTL ? 'مثال: 1520' : 'e.g. 1520', hint: isRTL ? 'الاستهلاك = الحالية − السابقة' : 'Consumption = current − previous' },
    { section: secReadings, name: 'unit_price', label: t('unit_price'), type: 'number', placeholder: isRTL ? 'ريال / وحدة استهلاك' : 'SAR / consumption unit' },
    // Amount + Payment
    { section: secPayment, name: 'amount', label: t('amount'), type: 'number', required: true, placeholder: isRTL ? 'المبلغ الإجمالي بالريال' : 'Total amount in SAR' },
    { section: secPayment, name: 'late_fee', label: t('late_fee'), type: 'number' },
    { section: secPayment, name: 'payment_method', label: t('payment_method'), type: 'select', options: methodOpts },
    { section: secPayment, name: 'payment_date', label: t('payment_date'), type: 'date' },
    { section: secPayment, name: 'status', label: t('status'), type: 'select', required: true, options: statusOpts },
    { section: secPayment, name: 'notes', label: t('notes'), type: 'textarea', colSpan: 2 },
  ];

  return (
    <CrudTable
      title={t('utility_bills')}
      icon={Zap}
      color="amber"
      resource="utility_bills"
      data={data}
      setData={setData}
      columns={columns}
      fields={fields}
      searchKeys={['bill_number', 'provider', 'notes']}
      filters={[
        { key: 'bill_type', label: t('bill_type'), options: billTypeOpts },
        { key: 'status', label: t('status'), options: statusOpts },
      ]}
    />
  );
}
