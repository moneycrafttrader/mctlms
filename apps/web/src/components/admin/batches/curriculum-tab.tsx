'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import {
  type CurriculumCategory,
  type CurriculumItem,
  getBatchCurriculum,
  addCurriculumItem,
  removeCurriculumItem,
  reorderCurriculum,
  getRecordings,
  type Recording,
} from '@/lib/api/recordings';

interface CurriculumTabProps {
  batchId: string;
}

export function CurriculumTab({ batchId }: CurriculumTabProps) {
  const [categories, setCategories] = useState<CurriculumCategory[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecordingId, setNewRecordingId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('General');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const [cats, recs] = await Promise.all([
        getBatchCurriculum(batchId),
        getRecordings(),
      ]);
      setCategories(cats);
      setRecordings(recs);
    } catch {
      setError('Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newRecordingId || !newCategoryName) return;
    try {
      await addCurriculumItem(batchId, {
        recordingId: newRecordingId,
        categoryName: newCategoryName,
      });
      setNewRecordingId('');
      setNewCategoryName('General');
      setShowAddForm(false);
      load();
    } catch {
      setError('Failed to add item');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeCurriculumItem(id);
      load();
    } catch {
      setError('Failed to remove item');
    }
  };

  const toggleCollapse = (category: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  if (loading) return <p className="text-gray-500">Loading curriculum...</p>;
  if (error) return <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>;

  const unusedRecordings = recordings.filter(
    (r) => !categories.some((c) => c.items.some((i) => i.recording_id === r.id)),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Curriculum</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add Recording
        </button>
      </div>

      {showAddForm && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recording</label>
            <select
              value={newRecordingId}
              onChange={(e) => setNewRecordingId(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select a recording...</option>
              {unusedRecordings.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. Week 1, Module 2"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newRecordingId}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No curriculum items yet. Add a recording to get started.</p>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.category} className="rounded-lg border border-gray-200">
              <button
                onClick={() => toggleCollapse(cat.category)}
                className="flex w-full items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-left text-sm font-semibold text-gray-900 hover:bg-gray-100"
              >
                {collapsed.has(cat.category) ? (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
                {cat.category}
                <span className="ml-auto text-xs font-normal text-gray-500">{cat.items.length} items</span>
              </button>

              {!collapsed.has(cat.category) && (
                <ul className="divide-y divide-gray-100">
                  {cat.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700"
                    >
                      <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
                      <span className="flex-1 truncate">
                        {item.recordings?.title ?? 'Unknown Recording'}
                      </span>
                      {item.module_name && (
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          {item.module_name}
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.is_published ? 'Published' : 'Draft'}
                      </span>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                        title="Remove from curriculum"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
