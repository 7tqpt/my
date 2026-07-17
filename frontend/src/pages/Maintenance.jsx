import React from 'react';
import { Wrench } from 'lucide-react';
import CrudTable, { StatusBadge } from '../components/CrudTable';
import { useApp } from '../context/AppContext';
import { useCollection } from '../hooks/useCollection';

export default function Maintenance() {
  const { t } = useApp();
  const { data, setData } = useCollection('maintenance');
  const { data: properties } = useCollection('properties');
  const { data: units } = useCollection('units');

  const prioOpts = [
    { value: 'low', label: t('low') },
    { value: 'medium', label: t('medium') },
    { value: 'high', label: t('high') },
    { value: 'critical', label: t('critical') },
  ];
  const statusOpts = [
    { value: 'pending', label: t('pending') },
    { value: 'in_progress', label: t('in_progress') },
    { value: 'completed', label: t('completed') },
    { value: 'cancelled', label: t('cancelled') },
  ];

  const columns = [
    { key: 'title', label: t('title'), render: (r) => (
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
          <Wrench size={14} className="text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.title}</p>
          <p className="text-[11px] text-gray-400 truncate max-w-[220px]">{r.description}</p>
        </div>
      </div>
    )},
    { key: 'property_id', label: t('property'), render: (r) => properties.find(p => p.id === r.property_id)?.name || '-' },
    { key: 'unit_id', label: t('unit'), render: (r) => r.unit_id ? (units.find(u => u.id === r.unit_id)?.unit_number || '-') : '-' },
    { key: 'priority', label: t('priority'), render: (r) => <StatusBadge status={r.priority} colorMap={{
      low: { color: 'gray', label: t('low') }, medium: { color: 'blue', label: t('medium') }, high: { color: 'amber', label: t('high') }, critical: { color: 'red', label: t('critical') }
    }} /> },
    { key: 'reported_date', label: t('reported_date') },
    { key: 'cost', label: t('cost'), render: (r) => r.cost ? new Intl.NumberFormat().format(r.cost) : '-' },
    { key: 'status', label: t('status'), render: (r) => <StatusBadge status={r.status} colorMap={{
      pending: { color: 'amber', label: t('pending') }, in_progress: { color: 'blue', label: t('in_progress') }, completed: { color: 'green', label: t('completed') }, cancelled: { color: 'gray', label: t('cancelled') }
    }} /> },
  ];

  const fields = [
    { name: 'title', label: t('title'), type: 'text', required: true, colSpan: 2 },
    { name: 'property_id', label: t('property'), type: 'select', required: true, options: properties.map(p => ({ value: p.id, label: p.name })) },
    { name: 'unit_id', label: t('unit'), type: 'select', options: units.map(u => ({ value: u.id, label: u.unit_number })) },
    { name: 'priority', label: t('priority'), type: 'select', required: true, options: prioOpts },
    { name: 'status', label: t('status'), type: 'select', required: true, options: statusOpts },
    { name: 'reported_date', label: t('reported_date'), type: 'date', required: true },
    { name: 'completed_date', label: t('completed_date'), type: 'date' },
    { name: 'cost', label: t('cost'), type: 'number' },
    { name: 'vendor', label: t('vendor'), type: 'text' },
    { name: 'description', label: t('description'), type: 'textarea', required: true, colSpan: 2 },
    { name: 'notes', label: t('notes'), type: 'textarea', colSpan: 2 },
  ];

  return (
    <CrudTable
      title={t('maintenance')}
      icon={Wrench}
      color="orange"
      resource="maintenance"
      data={data}
      setData={setData}
      columns={columns}
      fields={fields}
      searchKeys={['title', 'description', 'vendor']}
      filters={[
        { key: 'priority', label: t('priority'), options: prioOpts },
        { key: 'status', label: t('status'), options: statusOpts },
      ]}
    />
  );
}
