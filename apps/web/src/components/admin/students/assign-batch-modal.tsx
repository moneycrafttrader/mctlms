'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, ChevronDown, AlertTriangle } from 'lucide-react';
import { getAllBatches, assignStudentsToBatch, removeStudentsFromBatch } from '@/lib/api/courses';
import type { BatchRef } from '@/lib/api/users';

interface AssignBatchModalProps {
  isOpen: boolean;
  studentIds: string[];
  currentBatches?: BatchRef[];
  studentLabel: string;
  onClose: () => void;
  onSuccess: () => void;

}

export function AssignBatchModal({
  isOpen,
  studentIds,
  currentBatches = [],
  studentLabel,
  onClose,
  onSuccess,
}: AssignBatchModalProps) {
  const [allBatches, setAllBatches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ batchId: string; batchName: string } | null>(null);
  const [error, setError] = useState('');

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllBatches({ isActive: true, limit: 100 });
      setAllBatches(result.items);
    } catch {
      setError('Failed to load batches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedBatchId('');
      setError('');
      setConfirmRemove(null);
      fetchBatches();
    }
  }, [isOpen, fetchBatches]);

  const assignedIds = new Set(currentBatches.map((b) => b.id));
  const availableBatches = allBatches.filter((b) => !assignedIds.has(b.id));
  const isSingle = studentIds.length === 1;

  const handleAddBatch = async () => {
    if (!selectedBatchId) return;
    setAdding(true);
    setError('');
    try {
      await assignStudentsToBatch(selectedBatchId, studentIds);
      setSelectedBatchId('');
      onSuccess();
      await fetchBatches();
    } catch (err: any) {
      setError(err.message || 'Failed to assign batch');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveBatch = async () => {
    if (!confirmRemove) return;
    setRemoving(confirmRemove.batchId);
    setError('');
    try {
      await removeStudentsFromBatch(confirmRemove.batchId, studentIds);
      setConfirmRemove(null);
      onSuccess();
      await fetchBatches();
    } catch (err: any) {
      setError(err.message || 'Failed to remove batch');
    } finally {
      setRemoving(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="flex max-h-[85vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isSingle ? 'Manage Batches' : 'Assign to Batch'}
              </h2>
              <p className="text-sm text-gray-500">{studentLabel}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <>
                {isSingle && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Current Batches
                    </label>
                    {currentBatches.length === 0 ? (
                      <p className="text-sm text-gray-400">Not assigned to any batch</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {currentBatches.map((b) => (
                          <span
                            key={b.id}
                            className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700"
                          >
                            <span>{b.name}</span>
                            <button
                              onClick={() => setConfirmRemove({ batchId: b.id, batchName: b.name })}
                              disabled={removing === b.id}
                              className="rounded-full p-0.5 text-brand-400 hover:bg-brand-100 hover:text-brand-600 disabled:opacity-50"
                            >
                              {removing === b.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {isSingle ? 'Add to Batch' : 'Select Batch'}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="">
                        {availableBatches.length === 0 ? 'No unassigned batches' : 'Choose a batch...'}
                      </option>
                      {availableBatches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                  {availableBatches.length === 0 && allBatches.length > 0 && (
                    <p className="mt-1.5 text-xs text-amber-600">
                      {isSingle
                        ? 'Student is already in all available batches.'
                        : 'Students are already in all available batches.'}
                    </p>
                  )}
                  {allBatches.length === 0 && !loading && (
                    <p className="mt-1.5 text-xs text-amber-600">
                      No batches exist yet. Create one in Courses &amp; Batches.
                    </p>
                  )}
                </div>

                {selectedBatchId && (
                  <button
                    onClick={handleAddBatch}
                    disabled={adding}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                    {adding
                      ? 'Adding...'
                      : `Add to ${allBatches.find((b) => b.id === selectedBatchId)?.name ?? 'Batch'}`}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="border-t border-gray-200 px-6 py-4">
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}
            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {confirmRemove && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setConfirmRemove(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Remove Batch</h2>
              <button
                onClick={() => setConfirmRemove(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                <p className="text-sm text-gray-600">
                  Remove from <strong>{confirmRemove.batchName}</strong>?
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmRemove(null)}
                  disabled={removing !== null}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveBatch}
                  disabled={removing !== null}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {removing !== null && <Loader2 className="h-4 w-4 animate-spin" />}
                  {removing !== null ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
