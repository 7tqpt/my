import React from 'react';
import { Receipt } from 'lucide-react';
import CrudTable, { StatusBadge } from '../components/CrudTable';
import { useApp } from '../context/AppContext';
import { useCollection } from '../hooks/useCollection';

export default function Expenses() {
  const { t } = useApp();
  const { data, setData } = useCollection('expenses');
  const { data: properties } = useCollection('properties');

  const catOpts = [
    { value: 'maintenance', label: t('maintenance') },
    { value: 'utilities', label: t('utilities') },
    { value: 'insurance', label: t('insurance') },
    { value: 'tax', label: t('tax') },
    { value: 'cleaning', label: t('cleaning') },
    { value: 'security', label: t('security') },
    { value: 'management', label: t('management') },
    { value: 'other', label: t('other') },
  ];
  const statusOpts = [
    { value: 'paid', label: t('paid') },
    { value: 'pending', label: t('pending') },
    { value: 'approved', label: t('approved') },
  ];

  const columns = [
    { key: 'description', label: t('description'), render: (r) => (
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
          <Receipt size={14} className="text-red-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.description}</p>
          <p className="text-[11px] text-gray-400">{r.reference_number || ''}</p>
        </div>
      </div>
    )},
    { key: 'property_id', label: t('property'), render: (r) => properties.find(p => p.id === r.property_id)?.name || '-' },
    { key: 'category', label: t('category'), render: (r) => <span className="text-xs text-gray-600 dark:text-gray-400">{t(r.category)}</span> },
    { key: 'amount', label: t('amount'), render: (r) => <span className="font-bold text-gray-900 dark:text-white">{new Intl.NumberFormat().format(r.amount)}</span> },
    { key: 'expense_date', label: t('expense_date') },
    { key: 'vendor', label: t('vendor'), render: (r) => r.vendor || '-' },
    { key: 'status', label: t('status'), render: (r) => <StatusBadge status={r.status} colorMap={{
      paid: { color: 'green', label: t('paid') },
      pending: { color: 'amber', label: t('pending') },
      approved: { color: 'blue', label: t('approved') },
    }} /> },
  ];

  const fields = [
    { name: 'property_id', label: t('property'), type: 'select', required: true, options: properties.map(p => ({ value: p.id, label: p.name })), colSpan: 2 },
    { name: 'category', label: t('category'), type: 'select', required: true, options: catOpts },
    { name: 'amount', label: t('amount'), type: 'number', required: true },
    { name: 'expense_date', label: t('expense_date'), type: 'date', required: true },
    { name: 'status', label: t('status'), type: 'select', required: true, options: statusOpts },
    { name: 'vendor', label: t('vendor'), type: 'text' },
    { name: 'reference_number', label: t('reference_number'), type: 'text' },
    { name: 'description', label: t('description'), type: 'textarea', required: true, colSpan: 2 },
    { name: 'notes', label: t('notes'), type: 'textarea', colSpan: 2 },
  ];

  return (
    <CrudTable
      title={t('expenses')}
      icon={Receipt}
      color="red"
      resource="expenses"
      data={data}
      setData={setData}
      columns={columns}
      fields={fields}
      searchKeys={['description', 'vendor', 'reference_number']}
      filters={[
        { key: 'category', label: t('category'), options: catOpts },
        { key: 'status', label: t('status'), options: statusOpts },
      ]}
    />
  );
}
