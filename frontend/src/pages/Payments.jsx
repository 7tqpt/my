import React from 'react';
import { Wallet } from 'lucide-react';
import CrudTable, { StatusBadge } from '../components/CrudTable';
import { useApp } from '../context/AppContext';
import { useCollection } from '../hooks/useCollection';

export default function Payments() {
  const { t } = useApp();
  const { data, setData } = useCollection('payments');
  const { data: tenants } = useCollection('tenants');
  const { data: contracts } = useCollection('contracts');

  const typeOpts = [
    { value: 'rent', label: t('rent') },
    { value: 'electricity', label: t('electricity') },
    { value: 'utility', label: t('utility') },
    { value: 'other', label: t('other') },
  ];
  const statusOpts = [
    { value: 'paid', label: t('paid') },
    { value: 'pending', label: t('pending') },
    { value: 'overdue', label: t('overdue') },
  ];
  const methodOpts = [
    { value: 'cash', label: t('cash') },
    { value: 'bank_transfer', label: t('bank_transfer') },
    { value: 'check', label: t('check') },
    { value: 'card', label: t('card') },
  ];

  const columns = [
    { key: 'reference_number', label: t('reference_number'), render: (r) => (
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
          <Wallet size={14} className="text-green-600" />
        </div>
        <span className="text-sm font-mono text-gray-900 dark:text-white">{r.reference_number || '-'}</span>
      </div>
    )},
    { key: 'tenant_id', label: t('tenant'), render: (r) => tenants.find(x => x.id === r.tenant_id)?.name || '-' },
    { key: 'contract_id', label: t('contract'), render: (r) => contracts.find(x => x.id === r.contract_id)?.contract_number || '-' },
    { key: 'amount', label: t('amount'), render: (r) => (
      <span className="font-bold text-gray-900 dark:text-white">{new Intl.NumberFormat().format(r.amount)} <span className="text-[10px] text-gray-400">{t('sar')}</span></span>
    )},
    {
  key: 'due_date',
  label: 'شهر الاستحقاق',
  value: (r) => {
    const d = new Date(r.due_date);
    return `شهر ${d.getMonth() + 1} - ${d.getFullYear()}`;
  }
},
    { key: 'payment_date', label: t('payment_date'), render: (r) => r.payment_date || '-' },
    { key: 'type', label: t('type'), render: (r) => <span className="text-xs text-gray-600 dark:text-gray-400">{t(r.type)}</span> },
    { key: 'status', label: t('status'), render: (r) => <StatusBadge status={r.status} colorMap={{
      paid: { color: 'green', label: t('paid') },
      pending: { color: 'amber', label: t('pending') },
      overdue: { color: 'red', label: t('overdue') },
    }} /> },
  ];

  const fields = [
    { name: 'contract_id', label: t('contract'), type: 'select', required: true, options: contracts.map(c => ({ value: c.id, label: c.contract_number })) },
    { name: 'tenant_id', label: t('tenant'), type: 'select', required: true, options: tenants.map(x => ({ value: x.id, label: x.name })) },
    { name: 'amount', label: t('amount'), type: 'number', required: true },
    { name: 'late_fee', label: t('cost'), type: 'number' },
    { name: 'due_date', label: t('due_date'), type: 'date', required: true },
    { name: 'payment_date', label: t('payment_date'), type: 'date' },
    { name: 'type', label: t('type'), type: 'select', required: true, options: typeOpts },
    { name: 'payment_method', label: t('payment_method'), type: 'select', required: true, options: methodOpts },
    { name: 'status', label: t('status'), type: 'select', required: true, options: statusOpts },
    { name: 'reference_number', label: t('reference_number'), type: 'text' },
    { name: 'notes', label: t('notes'), type: 'textarea', colSpan: 2 },
  ];

  return (
    <CrudTable
      title={t('payments')}
      icon={Wallet}
      color="green"
      resource="payments"
      data={data}
      setData={setData}
      columns={columns}
      fields={fields}
      searchKeys={['reference_number', 'notes']}
      filters={[
        { key: 'status', label: t('status'), options: statusOpts },
        { key: 'type', label: t('type'), options: typeOpts },
      ]}
    />
  );
}
