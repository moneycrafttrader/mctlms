'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Megaphone, Plus, Pencil, Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  type Announcement,
} from '@/lib/api/notifications';
import { getCourses, getAllBatches } from '@/lib/api/courses';
import type { Course, Batch } from '@/lib/api/courses';

interface FormState {
  title: string;
  message: string;
  targetType: 'all' | 'course' | 'batch';
  targetId: string;
  isPublished: boolean;
}

const emptyForm: FormState = {
  title: '',
  message: '',
  targetType: 'all',
  targetId: '',
  isPublished: false,
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAnnouncements();
      setAnnouncements(data ?? []);
    } catch {
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  useEffect(() => {
    if (!modalOpen) return;
    if (form.targetType !== 'course') return;
    setCoursesLoading(true);
    getCourses().then((res) => setCourses((res as any).items ?? [])).catch(() => {}).finally(() => setCoursesLoading(false));
  }, [modalOpen, form.targetType]);

  useEffect(() => {
    if (!modalOpen) return;
    if (form.targetType !== 'batch') return;
    setBatchesLoading(true);
    getAllBatches().then((res) => setBatches((res as any).items ?? [])).catch(() => {}).finally(() => setBatchesLoading(false));
  }, [modalOpen, form.targetType]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSubmitError('');
    setModalOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      message: a.message,
      targetType: (a.target_type as 'all' | 'course' | 'batch') || 'all',
      targetId: a.target_id ?? '',
      isPublished: a.is_published,
    });
    setSubmitError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        message: form.message,
        targetType: form.targetType,
        targetId: form.targetType !== 'all' ? form.targetId : undefined,
        isPublished: form.isPublished,
      };

      if (editingId) {
        await updateAnnouncement(editingId, payload);
      } else {
        await createAnnouncement(payload);
      }
      setModalOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const targetLabel = (a: Announcement) => {
    switch (a.target_type) {
      case 'all': return 'All Students';
      case 'course': {
        const c = courses.find((c) => c.id === a.target_id);
        return c ? `Course: ${c.name}` : 'Specific Course';
      }
      case 'batch': {
        const b = batches.find((b) => b.id === a.target_id);
        return b ? `Batch: ${b.name}` : 'Specific Batch';
      }
      default: return 'All Students';
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Announcements</h1>
          <p className="mt-1 text-sm text-text-muted">{announcements.length} announcement{announcements.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate} icon={<Plus className="h-4 w-4" />}>Create Announcement</Button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-text-muted"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Megaphone className="mb-3 h-10 w-10" />
          <p className="text-sm font-medium">No announcements yet</p>
          <p className="mt-1 text-xs">Create your first announcement to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-surface-border bg-surface-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-muted text-left text-xs font-medium text-text-secondary">
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Target</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((a) => (
                  <tr key={a.id} className="border-b border-surface-border hover:bg-surface-muted/50">
                    <td className="px-6 py-4 font-medium text-text-primary max-w-xs truncate">{a.title}</td>
                    <td className="px-6 py-4 text-text-secondary">{targetLabel(a)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={a.is_published ? 'success' : 'neutral'}>
                        {a.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-text-secondary whitespace-nowrap">{formatDate(a.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => openEdit(a)}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Announcement' : 'Create Announcement'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="announcement-form" loading={submitting}>{editingId ? 'Update' : 'Create'}</Button>
          </div>
        }
      >
        <form id="announcement-form" onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Announcement title" className="block w-full rounded-lg border border-surface-border bg-surface-page px-3 py-2 text-sm text-text-primary focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Message</label>
            <textarea required rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Write your announcement message..." className="block w-full rounded-lg border border-surface-border bg-surface-page px-3 py-2 text-sm text-text-primary focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy resize-y" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Target Audience</label>
            <select value={form.targetType} onChange={(e) => setForm((f) => ({ ...f, targetType: e.target.value as 'all' | 'course' | 'batch', targetId: '' }))}
              className="block w-full rounded-lg border border-surface-border bg-surface-page px-3 py-2 text-sm text-text-primary focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy">
              <option value="all">All Students</option>
              <option value="course">Specific Course</option>
              <option value="batch">Specific Batch</option>
            </select>
          </div>
          {form.targetType === 'course' && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Course</label>
              {coursesLoading ? (
                <div className="flex items-center gap-2 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading courses...</div>
              ) : (
                <select required value={form.targetId} onChange={(e) => setForm((f) => ({ ...f, targetId: e.target.value }))}
                  className="block w-full rounded-lg border border-surface-border bg-surface-page px-3 py-2 text-sm text-text-primary focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy">
                  <option value="">Select a course...</option>
                  {courses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              )}
            </div>
          )}
          {form.targetType === 'batch' && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Batch</label>
              {batchesLoading ? (
                <div className="flex items-center gap-2 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading batches...</div>
              ) : (
                <select required value={form.targetId} onChange={(e) => setForm((f) => ({ ...f, targetId: e.target.value }))}
                  className="block w-full rounded-lg border border-surface-border bg-surface-page px-3 py-2 text-sm text-text-primary focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy">
                  <option value="">Select a batch...</option>
                  {batches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                </select>
              )}
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              className="rounded border-surface-border text-brand-navy focus:ring-brand-navy" />
            <span className="text-sm text-text-secondary">Publish immediately</span>
          </label>
          {submitError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{submitError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
