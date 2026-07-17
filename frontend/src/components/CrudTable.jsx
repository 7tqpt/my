import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, X, Eye, Info, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';

// A reusable CRUD table + add/edit modal for entities.
// Props:
// - title: string
// - icon: LucideIcon
// - color: tailwind color name (blue, emerald, indigo, ...)
// - data, setData: state
// - columns: [{ key, label, render? }]
// - fields: [{ name, label, type, options?, required?, colSpan?, placeholder? }]
// - filters?: [{ key, label, options }]
// - searchKeys: array of keys used for search
export default function CrudTable({ title, icon: Icon, color = 'blue', data, setData, columns, fields, filters = [], searchKeys = [], resource, extraActions, canDelete }) {
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorType, setErrorType] = useState('delete'); // 'delete' | 'save'
  const [previewRow, setPreviewRow] = useState(null);

  const filtered = useMemo(() => {
    return data.filter((row) => {
      if (search && searchKeys.length) {
        const q = search.toLowerCase();
        const hit = searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q));
        if (!hit) return false;
      }
      for (const [k, v] of Object.entries(activeFilters)) {
        if (v && v !== 'all' && String(row[k]) !== String(v)) return false;
      }
      return true;
    });
  }, [data, search, activeFilters, searchKeys]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (row) => { setEditing(row); setModalOpen(true); };

  const handleSave = async (formData) => {
    try {
      if (editing) {
        await setData(data.map((r) => (r.id === editing.id ? { ...r, ...formData } : r)));
      } else {
        const newId = Math.max(0, ...data.map((r) => Number(r.id) || 0)) + 1;
        await setData([...data, { id: newId, ...formData }]);
      }
      setModalOpen(false); setEditing(null);
    } catch (e) {
      setErrorType('save');
      setErrorMsg(e?.response?.data?.detail || e.message || 'Save failed');
      setModalOpen(false); setEditing(null);
    }
  };

  const handleDelete = async () => {
    if (confirmDelete) {
      const target = confirmDelete;
      setConfirmDelete(null);
      try {
        const filtered = data.filter((r) => r.id !== target.id);
        await setData(filtered);
      } catch (e) {
        setErrorType('delete');
        setErrorMsg(e?.response?.data?.detail || e.message || 'Delete failed');
      }
    }
  };

  const colorMap = {
    blue: { grad: 'from-blue-500 to-indigo-600', ring: 'shadow-blue-200/50', text: 'text-blue-600' },
    indigo: { grad: 'from-indigo-500 to-purple-600', ring: 'shadow-indigo-200/50', text: 'text-indigo-600' },
    emerald: { grad: 'from-emerald-500 to-teal-600', ring: 'shadow-emerald-200/50', text: 'text-emerald-600' },
    amber: { grad: 'from-amber-500 to-orange-600', ring: 'shadow-amber-200/50', text: 'text-amber-600' },
    green: { grad: 'from-green-500 to-emerald-600', ring: 'shadow-green-200/50', text: 'text-green-600' },
    red: { grad: 'from-red-500 to-rose-600', ring: 'shadow-red-200/50', text: 'text-red-600' },
    orange: { grad: 'from-orange-500 to-red-600', ring: 'shadow-orange-200/50', text: 'text-orange-600' },
    cyan: { grad: 'from-cyan-500 to-blue-600', ring: 'shadow-cyan-200/50', text: 'text-cyan-600' },
    purple: { grad: 'from-purple-500 to-pink-600', ring: 'shadow-purple-200/50', text: 'text-purple-600' },
    pink: { grad: 'from-pink-500 to-rose-600', ring: 'shadow-pink-200/50', text: 'text-pink-600' },
    gray: { grad: 'from-gray-500 to-gray-700', ring: 'shadow-gray-200/50', text: 'text-gray-600' },
  };
  const c = colorMap[color] || colorMap.blue;
  const isRTL = lang === 'ar';

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
            <Info size={14} className="text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 text-sm text-red-700 dark:text-red-300">
            <p className="font-semibold">{errorType === 'save' ? t('operation_failed') : t('cannot_delete')}</p>
            <p className="text-xs mt-0.5">{errorMsg}</p>
          </div>
          <button data-testid="close-error-banner-btn" onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-600 dark:hover:text-red-200">
            <X size={16} />
          </button>
        </div>
      )}
      {/* Header */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${c.grad} rounded-2xl p-6 text-white shadow-lg ${c.ring}`}>
        <div className="absolute inset-0 opacity-10">
          <svg className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-0 h-full w-1/2`} viewBox="0 0 400 200" fill="none">
            <circle cx="350" cy="50" r="120" fill="white" />
            <circle cx="250" cy="180" r="80" fill="white" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Icon className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-white/80 text-sm">{filtered.length} {t('total')}</p>
            </div>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
            <Plus size={16} />{t('add')}
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={14} className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search')}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 text-sm bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:text-gray-100`}
            />
          </div>
          {filters.map((f) => (
            <select
              key={f.key}
              value={activeFilters[f.key] || 'all'}
              onChange={(e) => setActiveFilters({ ...activeFilters, [f.key]: e.target.value })}
              className="px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-gray-100 min-w-[150px]"
            >
              <option value="all">{f.label}: {t('all')}</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
                {columns.map((col) => (
                  <th key={col.key} className="text-start px-6 py-3.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{col.label}</th>
                ))}
                <th className="text-end px-6 py-3.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Icon className="text-gray-400" size={22} />
                    </div>
                    <p className="text-sm text-gray-400 dark:text-gray-500">{t('no_data')}</p>
                  </td>
                </tr>
              ) : filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-3.5 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {col.render ? col.render(row) : row[col.key] ?? '-'}
                    </td>
                  ))}
                  <td className="px-6 py-3.5 text-end whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {extraActions && extraActions(row)}
                      <button onClick={() => resource ? navigate(`/profile/${resource}/${row.id}`) : setPreviewRow(row)} title={t('preview')} className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition-colors">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => openEdit(row)} title={t('edit')} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      {(!canDelete || canDelete(row)) ? (
                        <button onClick={() => setConfirmDelete(row)} title={t('delete')} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <span title={t('protected_record')} className="p-2 rounded-lg text-gray-300 dark:text-gray-600 cursor-not-allowed">
                          <Shield size={14} />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewRow && (
        <PreviewModal
          row={previewRow}
          title={title}
          fields={fields}
          columns={columns}
          colorGrad={c.grad}
          onClose={() => setPreviewRow(null)}
          onEdit={() => { openEdit(previewRow); setPreviewRow(null); }}
        />
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <FormModal
          title={editing ? `${t('edit')} - ${title}` : `${t('add')} ${title}`}
          fields={fields}
          initial={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={handleSave}
          colorGrad={c.grad}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-500" size={22} />
            </div>
            <h3 className="text-center text-lg font-bold text-gray-900 dark:text-white mb-2">{t('confirm_delete')}</h3>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">{title}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{t('cancel')}</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">{t('delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormModal({ title, fields, initial, onClose, onSave, colorGrad }) {
  const { t } = useApp();
  const [values, setValues] = useState(() => {
    const base = {};
    fields.forEach((f) => { base[f.name] = initial?.[f.name] ?? (f.type === 'number' ? '' : ''); });
    return base;
  });

  const setV = (name, value) => setValues((v) => ({ ...v, [name]: value }));

  const submit = (e) => {
    e.preventDefault();
    const cleaned = { ...values };
    fields.forEach((f) => {
      if (f.type === 'number' && cleaned[f.name] !== '' && cleaned[f.name] != null) {
        cleaned[f.name] = Number(cleaned[f.name]);
      }
    });
    onSave(cleaned);
  };

  // Group fields into sections when a 'section' key is provided
  const hasSections = fields.some((f) => f.section);
  const sections = hasSections
    ? fields.reduce((acc, f) => {
        const s = f.section || 'default';
        if (!acc[s]) acc[s] = [];
        acc[s].push(f);
        return acc;
      }, {})
    : { default: fields };
  const sectionOrder = Object.keys(sections);

  const renderField = (f) => (
    <div key={f.name} className={f.colSpan === 2 ? 'md:col-span-2' : ''}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {f.label}{f.required && <span className="text-red-500 ms-1">*</span>}
      </label>
      {f.type === 'select' ? (
        <select
          value={values[f.name] ?? ''}
          onChange={(e) => setV(f.name, e.target.value)}
          required={f.required}
          className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:text-gray-100"
        >
          <option value="">--</option>
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : f.type === 'textarea' ? (
        <textarea
          value={values[f.name] ?? ''}
          onChange={(e) => setV(f.name, e.target.value)}
          rows={3}
          placeholder={f.placeholder}
          className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:text-gray-100"
        />
      ) : (
        <input
          type={f.type || 'text'}
          value={values[f.name] ?? ''}
          onChange={(e) => setV(f.name, e.target.value)}
          required={f.required}
          placeholder={f.placeholder}
          step={f.type === 'number' ? 'any' : undefined}
          className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:text-gray-100"
        />
      )}
      {f.hint && <p className="mt-1 text-[11px] text-gray-400">{f.hint}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full my-8">
        <div className={`bg-gradient-to-r ${colorGrad} px-6 py-4 rounded-t-2xl flex items-center justify-between`}>
          <h3 className="text-white text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 max-h-[70vh] overflow-y-auto">
          {hasSections ? (
            sectionOrder.map((secName) => (
              <div key={secName} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                  <div className={`w-1 h-5 rounded-full bg-gradient-to-b ${colorGrad}`}></div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">{secName}</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sections[secName].map(renderField)}
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map(renderField)}
            </div>
          )}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{t('cancel')}</button>
            <button type="submit" className={`flex-1 py-2.5 rounded-xl bg-gradient-to-r ${colorGrad} text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all`}>{t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Preview / details modal - shows all fields of a row in a nicely formatted card
function PreviewModal({ row, title, fields, columns, colorGrad, onClose, onEdit }) {
  const { t } = useApp();
  // Prefer the columns' render() outputs when available (they include lookups & badges)
  // Fallback to raw field values.
  const items = [];
  // Show primary column values first (with rendered content)
  columns.forEach((col) => {
    const val = col.render ? col.render(row) : (row[col.key] ?? '-');
    items.push({ key: col.key, label: col.label, value: val, isNode: !!col.render });
  });
  // Then show any remaining schema fields not in columns
  fields.forEach((f) => {
    if (columns.find((c) => c.key === f.name)) return;
    const raw = row[f.name];
    if (raw == null || raw === '') return;
    items.push({ key: f.name, label: f.label, value: String(raw), isNode: false });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full my-8">
        <div className={`bg-gradient-to-r ${colorGrad} px-6 py-5 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Info className="text-white" size={22} />
              </div>
              <div>
                <p className="text-white/80 text-xs font-medium">{t('preview')}</p>
                <h3 className="text-white text-lg font-bold">{title}</h3>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((it, i) => (
              <div key={i} className={`p-3.5 rounded-xl bg-gray-50/70 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/50 ${i === 0 ? 'sm:col-span-2' : ''}`}>
                <dt className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{it.label}</dt>
                <dd className="text-sm font-medium text-gray-900 dark:text-white break-words">{it.value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{t('close')}</button>
            <button onClick={onEdit} className={`flex-1 py-2.5 rounded-xl bg-gradient-to-r ${colorGrad} text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2`}>
              <Edit2 size={14} />{t('edit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Common status badge
export function StatusBadge({ status, colorMap }) {
  const cfg = colorMap[status] || { color: 'gray', label: status };
  const colors = {
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full ${colors[cfg.color] || colors.gray}`}>{cfg.label}</span>;
}
