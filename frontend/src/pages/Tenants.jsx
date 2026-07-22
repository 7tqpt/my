import React from 'react';
import { Users } from 'lucide-react';
import CrudTable, { StatusBadge } from '../components/CrudTable';
import { useApp } from '../context/AppContext';
import { useCollection } from '../hooks/useCollection';

export default function Tenants() {
  const { t } = useApp();
  const { data, setData } = useCollection('tenants');

  const columns = [
    { key: 'name', label: t('name'), render: (r) => (
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
          <span className="text-white text-xs font-bold">{r.name?.charAt(0)}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.name}</p>
          <p className="text-[11px] text-gray-400">{r.national_id}</p>
        </div>
      </div>
    )},
    { key: 'phone', label: t('phone') },
    { key: 'company_name', label: t('company_name'), render: (r) => r.company_name || '-' },
    { key: 'address', label: t('address'), render: (r) => r.address || '-' },
    { key: 'status', label: t('status'), render: (r) => <StatusBadge status={r.status} colorMap={{ active: { color: 'green', label: t('active') }, inactive: { color: 'red', label: t('inactive') } }} /> },
  ];

  const fields = [
    { name: 'name', label: t('name'), type: 'text', required: true },
    { name: 'phone', label: t('phone'), type: 'text', required: true },
    { name: 'national_id', label: t('national_id'), type: 'text', required: true },
    { name: 'company_name', label: t('company_name'), type: 'text' },
    { name: 'address', label: t('address'), type: 'text', colSpan: 2 },
    { name: 'status', label: t('status'), type: 'select', options: [{ value: 'active', label: t('active') }, { value: 'inactive', label: t('inactive') }] },
    { name: 'notes', label: t('notes'), type: 'textarea', colSpan: 2 },
  ];

  return (
    <CrudTable
      title={t('tenants')}
      icon={Users}
      color="emerald"
      resource="tenants"
      data={data}
      setData={setData}
      columns={columns}
      fields={fields}
      searchKeys={['name', 'phone', 'national_id', 'company_name']}
      filters={[{ key: 'status', label: t('status'), options: [{ value: 'active', label: t('active') }, { value: 'inactive', label: t('inactive') }] }]}
    />
  );
}
