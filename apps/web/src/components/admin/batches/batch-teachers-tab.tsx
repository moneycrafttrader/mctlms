'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { GraduationCap, UserPlus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  assignTeachersToBatch,
  getBatchTeachers,
  removeTeachersFromBatch,
  type BatchTeacherProfile,
} from '@/lib/api/courses';
import { getTeachers, type User } from '@/lib/api/users';

interface BatchTeachersTabProps {
  batchId: string;
}

export function BatchTeachersTab({ batchId }: BatchTeachersTabProps) {
  const [assigned, setAssigned] = useState<BatchTeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [catalog, setCatalog] = useState<User[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadAssigned = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await getBatchTeachers(batchId);
      setAssigned(rows ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load teachers');
      setAssigned([]);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    loadAssigned();
  }, [loadAssigned]);

  const openAssign = async () => {
    setShowAssign(true);
    setSearch('');
    setSelected(new Set());
    setCatalogLoading(true);
    try {
      const result = await getTeachers();
      setCatalog(result.items ?? []);
    } catch {
      setCatalog([]);
    } finally {
      setCatalogLoading(false);
    }
  };

  const assignedIds = useMemo(() => new Set(assigned.map((t) => t.id)), [assigned]);

  const eligible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (catalog ?? [])
      .filter((t) => t.is_active !== false)
      .filter((t) => !assignedIds.has(t.id))
      .filter((t) => {
        if (!q) return true;
        return (
          t.name?.toLowerCase().includes(q) ||
          t.email?.toLowerCase().includes(q)
        );
      });
  }, [catalog, assignedIds, search]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAssign = async () => {
    if (selected.size === 0) return;
    setAssigning(true);
    setError('');
    setSuccess('');
    try {
      await assignTeachersToBatch(batchId, [...selected]);
      setSuccess(`${selected.size} teacher${selected.size === 1 ? '' : 's'} assigned`);
      setShowAssign(false);
      await loadAssigned();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (teacherId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this batch? Their account will not be deleted.`)) return;
    setRemovingId(teacherId);
    setError('');
    setSuccess('');
    try {
      await removeTeachersFromBatch(batchId, [teacherId]);
      setSuccess('Teacher removed from batch');
      await loadAssigned();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Removal failed');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">
          {loading ? 'Loading…' : `${assigned.length} teacher${assigned.length === 1 ? '' : 's'} assigned`}
        </p>
        <Button type="button" onClick={openAssign} className="inline-flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Assign teacher
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800" role="status">
          {success}
        </p>
      )}

      {loading ? (
        <div className="rounded-xl border border-surface-border bg-surface-card p-12 text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-surface-border border-t-brand-500" />
          <p className="mt-3 text-sm text-text-muted">Loading teachers…</p>
        </div>
      ) : assigned.length === 0 ? (
        <div className="rounded-xl border border-surface-border bg-surface-card p-12 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-text-muted" />
          <h3 className="mt-3 text-sm font-semibold text-text-primary">No teachers assigned</h3>
          <p className="mt-1 text-sm text-text-muted">Assign at least one teacher so they can access this batch.</p>
          <Button type="button" className="mt-4" onClick={openAssign}>
            Assign teacher
          </Button>
        </div>
      ) : (
        <TeachersTable teachers={assigned} removingId={removingId} onRemove={handleRemove} />
      )}

      <Modal isOpen={showAssign} onClose={() => !assigning && setShowAssign(false)} title="Assign teachers">
        <div className="space-y-4">
          <input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-surface-border px-3 py-2 text-sm"
            aria-label="Search teachers"
          />
          {catalogLoading ? (
            <p className="text-sm text-text-muted">Loading teacher accounts…</p>
          ) : eligible.length === 0 ? (
            <p className="text-sm text-text-muted">No matching teachers available to assign.</p>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-surface-border p-2">
              {eligible.map((t) => (
                <li key={t.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-muted">
                    <input
                      type="checkbox"
                      checked={selected.has(t.id)}
                      onChange={() => toggleSelect(t.id)}
                      className="h-4 w-4 rounded border-surface-border"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-text-primary">{t.name}</span>
                      <span className="block truncate text-xs text-text-muted">{t.email}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowAssign(false)} disabled={assigning}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAssign} loading={assigning} disabled={selected.size === 0}>
              Assign selected ({selected.size})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TeachersTable({
  teachers,
  removingId,
  onRemove,
}: {
  teachers: BatchTeacherProfile[];
  removingId: string | null;
  onRemove: (id: string, name: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface-card">
      <table className="w-full min-w-[320px] text-sm">
        <thead>
          <tr className="bg-surface-muted">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted">Name</th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase text-text-muted sm:table-cell">
              Email
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-text-muted">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {teachers.map((t) => (
            <tr key={t.id} className="hover:bg-surface-muted/50">
              <td className="px-4 py-3 font-medium text-text-primary">{t.name}</td>
              <td className="hidden px-4 py-3 text-text-secondary sm:table-cell">{t.email}</td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onRemove(t.id, t.name)}
                  disabled={removingId === t.id}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                  aria-label={`Remove ${t.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}