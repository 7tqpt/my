import React from 'react';
import { UsersRound } from 'lucide-react';
import CrudTable, { StatusBadge } from '../components/CrudTable';
import { useApp } from '../context/AppContext';
import { useCollection } from '../hooks/useCollection';

export default function Users() {
  const { t } = useApp();
  const { data, setData } = useCollection('users');

  const columns = [
    { key: 'name', label: t('name'), render: (r) => (
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-sm">
          <span className="text-white text-xs font-bold">{r.name?.charAt(0)}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.name}</p>
          <p className="text-[11px] text-gray-400">{r.username}</p>
        </div>
      </div>
    )},
    { key: 'email', label: t('email'), render: (r) => r.email || '-' },
    { key: 'role', label: t('role'), render: (r) => <StatusBadge status={r.role} colorMap={{ admin: { color: 'purple', label: t('admin') }, user: { color: 'blue', label: t('user') } }} /> },
    { key: 'is_active', label: t('status'), render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} colorMap={{ active: { color: 'green', label: t('active') }, inactive: { color: 'gray', label: t('inactive') } }} /> },
  ];

  const fields = [
    { name: 'name', label: t('name'), type: 'text', required: true },
    { name: 'username', label: t('username'), type: 'text', required: true },
    { name: 'email', label: t('email'), type: 'email', colSpan: 2 },
    { name: 'password', label: t('password'), type: 'password', placeholder: '(leave blank to keep current on edit)', colSpan: 2 },
    { name: 'role', label: t('role'), type: 'select', required: true, options: [{ value: 'admin', label: t('admin') }, { value: 'user', label: t('user') }] },
    { name: 'is_active', label: t('status'), type: 'select', required: true, options: [{ value: true, label: t('active') }, { value: false, label: t('inactive') }] },
  ];

  return (
    <CrudTable
      title={t('users')}
      icon={UsersRound}
      color="purple"
      resource="users"
      data={data}
      setData={setData}
      columns={columns}
      fields={fields}
      searchKeys={['name', 'username', 'email']}
      filters={[{ key: 'role', label: t('role'), options: [{ value: 'admin', label: t('admin') }, { value: 'user', label: t('user') }] }]}
      canDelete={(row) => row.username !== 'admin'}
    />
  );
}
