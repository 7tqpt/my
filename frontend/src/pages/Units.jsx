import React from 'react';
import { DoorOpen } from 'lucide-react';
import CrudTable, { StatusBadge } from '../components/CrudTable';
import { useApp } from '../context/AppContext';
import { useCollection } from '../hooks/useCollection';

export default function Units() {
  const { t } = useApp();
  const { data, setData } = useCollection('units');
  const { data: properties } = useCollection('properties');

  const statusOpts = [
    { value: 'vacant', label: t('vacant') },
    { value: 'rented', label: t('rented') },
    { value: 'under_maintenance', label: t('under_maintenance') },
    { value: 'reserved', label: t('reserved') },
  ];

  const columns = [
    { key: 'unit_number', label: t('unit_number'), render: (r) => (
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center">
          <DoorOpen size={14} className="text-cyan-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.unit_number}</p>
          <p className="text-[11px] text-gray-400">{t('floor')}: {r.floor || '-'}</p>
        </div>
      </div>
    )},
    { key: 'property_id', label: t('property'), render: (r) => properties.find(p => p.id === r.property_id)?.name || '-' },
    { key: 'area', label: t('area'), render: (r) => `${r.area} ²م` },
    { key: 'rooms', label: t('rooms'), render: (r) => `${r.rooms} / ${r.bathrooms}` },
    { key: 'rent_price', label: t('rent_price'), render: (r) => (
      <span className="font-semibold text-gray-900 dark:text-white">{new Intl.NumberFormat().format(r.rent_price)} <span className="text-[10px] text-gray-400">{t('sar')}</span></span>
    )},
    { key: 'status', label: t('status'), render: (r) => <StatusBadge status={r.status} colorMap={{
      vacant: { color: 'red', label: t('vacant') },
      rented: { color: 'green', label: t('rented') },
      under_maintenance: { color: 'amber', label: t('under_maintenance') },
      reserved: { color: 'blue', label: t('reserved') },
    }} /> },
  ];

  const fields = [
    { name: 'property_id', label: t('property'), type: 'select', required: true, options: properties.map(p => ({ value: p.id, label: p.name })), colSpan: 2 },
    { name: 'unit_number', label: t('unit_number'), type: 'text', required: true },
    { name: 'floor', label: t('floor'), type: 'text' },
    { name: 'area', label: t('area'), type: 'number', required: true },
    { name: 'rent_price', label: t('rent_price'), type: 'number', required: true },
    { name: 'rooms', label: t('rooms'), type: 'number', required: true },
    { name: 'bathrooms', label: t('bathrooms'), type: 'number', required: true },
    { name: 'status', label: t('status'), type: 'select', required: true, options: statusOpts, colSpan: 2 },
    { name: 'notes', label: t('notes'), type: 'textarea', colSpan: 2 },
  ];

  return (
    <CrudTable
      title={t('units')}
      icon={DoorOpen}
      color="cyan"
      resource="units"
      data={data}
      setData={setData}
      columns={columns}
      fields={fields}
      searchKeys={['unit_number', 'floor', 'notes']}
      filters={[{ key: 'status', label: t('status'), options: statusOpts }]}
    />
  );
}
