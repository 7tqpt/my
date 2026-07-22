import React from 'react';
import { Building2 } from 'lucide-react';
import CrudTable, { StatusBadge } from '../components/CrudTable';
import { useApp } from '../context/AppContext';
import { useCollection } from '../hooks/useCollection';

export default function Properties() {
  const { t } = useApp();
  const { data, setData } = useCollection('properties');
  const { data: owners } = useCollection('owners');
  const { data: units } = useCollection('units');

  const typeOpts = [
    { value: 'residential', label: t('residential') },
    { value: 'commercial', label: t('commercial') },
    { value: 'industrial', label: t('industrial') },
    { value: 'administrative', label: t('administrative') },
  ];

  const columns = [
    { key: 'name', label: t('property_name'), render: (r) => (
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
          <Building2 size={14} className="text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.name}</p>
          <p className="text-[11px] text-gray-400">{r.address}</p>
        </div>
      </div>
    )},
    { key: 'owner_id', label: t('owner'), render: (r) => owners.find(o => o.id === r.owner_id)?.name || '-' },
    { key: 'type', label: t('type'), render: (r) => <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('property_type_' + r.type)}</span> },
    { key: 'city', label: t('city'), render: (r) => `${r.city}${r.district ? ' · ' + r.district : ''}` },
    { key: 'total_units', label: t('units'), render: (r) => {
      const propUnits = units.filter(u => u.property_id === r.id);
      const total = propUnits.length || r.total_units;
      const rented = propUnits.filter(u => u.status === 'rented').length;
      return <span className="text-sm font-semibold text-gray-900 dark:text-white">{rented}/{total}</span>;
    }},
    { key: 'status', label: t('status'), render: (r) => <StatusBadge status={r.status} colorMap={{ active: { color: 'green', label: t('active') }, inactive: { color: 'red', label: t('inactive') }, under_maintenance: { color: 'amber', label: t('under_maintenance') } }} /> },
  ];

  const fields = [
    { name: 'name', label: t('property_name'), type: 'text', required: true },
    { name: 'owner_id', label: t('owner'), type: 'select', required: true, options: owners.map(o => ({ value: o.id, label: o.name })) },
    { name: 'type', label: t('type'), type: 'select', required: true, options: typeOpts },
    { name: 'city', label: t('city'), type: 'text', required: true },
    { name: 'district', label: t('district'), type: 'text' },
    { name: 'total_units', label: t('total_units'), type: 'number' },
    { name: 'address', label: t('address'), type: 'textarea', required: true, colSpan: 2 },
    { name: 'land_area', label: t('land_area'), type: 'number' },
    { name: 'built_area', label: t('built_area'), type: 'number' },
    { name: 'status', label: t('status'), type: 'select', options: [{ value: 'active', label: t('active') }, { value: 'inactive', label: t('inactive') }, { value: 'under_maintenance', label: t('under_maintenance') }] },
    { name: 'notes', label: t('notes'), type: 'textarea', colSpan: 2 },
  ];

  return (
    <CrudTable
      title={t('properties')}
      icon={Building2}
      color="blue"
      resource="properties"
      data={data}
      setData={setData}
      columns={columns}
      fields={fields}
      searchKeys={['name', 'city', 'district', 'address']}
      filters={[
        { key: 'type', label: t('type'), options: typeOpts },
        { key: 'status', label: t('status'), options: [{ value: 'active', label: t('active') }, { value: 'inactive', label: t('inactive') }] },
      ]}
    />
  );
}
