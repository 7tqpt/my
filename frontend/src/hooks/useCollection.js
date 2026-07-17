import { useEffect, useState, useCallback } from 'react';
import { listAll, createOne, updateOne, deleteOne } from '../lib/api';

// Manages a collection resource with API calls. Returns state + [data, setData]-compatible tuple.
export function useCollection(resource) {
  const [data, setLocalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listAll(resource);
      setLocalData(rows || []);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => { refresh(); }, [refresh]);

  // setData receives a new full array (like plain useState). We diff it against current state
  // to detect: added rows (no matching id in old), updated rows (id present with different data),
  // removed rows (missing from new).
  const setData = useCallback(async (nextArrOrFn) => {
    const next = typeof nextArrOrFn === 'function' ? nextArrOrFn(data) : nextArrOrFn;
    const oldById = Object.fromEntries(data.map((r) => [String(r.id), r]));
    const newById = Object.fromEntries(next.map((r) => [String(r.id), r]));

    // detect removed
    const removed = data.filter((r) => !(String(r.id) in newById));
    // detect added: new rows whose id was auto-generated (numeric) or missing from old
    const added = next.filter((r) => !(String(r.id) in oldById));
    // detect updated: same id, different serialized
    const updated = next.filter((r) => {
      const old = oldById[String(r.id)];
      return old && JSON.stringify(old) !== JSON.stringify(r);
    });

    try {
      for (const r of removed) {
        await deleteOne(resource, r.id);
      }
      for (const r of added) {
        // strip client-side id
        const { id, ...rest } = r;
        await createOne(resource, rest);
      }
      for (const r of updated) {
        const { id, ...rest } = r;
        await updateOne(resource, id, rest);
      }
      // reload from server so ids/timestamps are correct
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
      await refresh();
      throw e; // let callers catch (e.g., to show a friendly toast)
    }
  }, [data, resource, refresh]);

  return { data, setData, loading, error, refresh };
}
