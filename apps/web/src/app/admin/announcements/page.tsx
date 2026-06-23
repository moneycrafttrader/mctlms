'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Megaphone, Plus, Pencil, Loader2, AlertCircle, Send } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AdminPageHeader } from '@/components/shared/AdminPageHeader';
import { AdminSection } from '@/components/shared/AdminSection';
import { AdminStatCard } from '@/components/shared/AdminStatCard';
import {
  getAnnouncements, createAnnouncement, updateAnnouncement, type Announcement,
} from '@/lib/api/notifications';
import { getCourses, getAllBatches } from '@/lib/api/courses';
import type { Course, Batch } from '@/lib/api/courses';

interface FormState {
  title: string; message: string;
  targetType: 'all' | 'course' | 'batch'; targetId: string; isPublished: boolean;
}
const emptyForm: FormState = { title: '', message: '', targetType: 'all', targetId: '', isPublished: false };

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

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try { setAnnouncements(await getAnnouncements() ?? []); } catch { setError('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!modalOpen) return;
    if (form.targetType === 'course') { getCourses().then(r => setCourses((r as any).items ?? [])).catch(() => {}); }
    if (form.targetType === 'batch') { getAllBatches().then(r => setBatches((r as any).items ?? [])).catch(() => {}); }
  }, [modalOpen, form.targetType]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setSubmitError(''); setModalOpen(true); };
  const openEdit = (a: Announcement) => { setEditingId(a.id); setForm({ title: a.title, message: a.message, targetType: (a.target_type as any) || 'all', targetId: a.target_id ?? '', isPublished: a.is_published }); setSubmitError(''); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitError(''); setSubmitting(true);
    try {
      const payload = { title: form.title, message: form.message, targetType: form.targetType, targetId: form.targetType !== 'all' ? form.targetId : undefined, isPublished: form.isPublished };
      editingId ? await updateAnnouncement(editingId, payload) : await createAnnouncement(payload);
      setModalOpen(false); fetchData();
    } catch (err: any) { setSubmitError(err.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const targetLabel = (a: Announcement) => {
    switch(a.target_type) {
      case 'all': return 'All Students';
      case 'course': { const c = courses.find(x => x.id===a.target_id); return c ? `Course: ${c.name}` : 'Course'; }
      case 'batch': { const b = batches.find(x => x.id===a.target_id); return b ? `Batch: ${b.name}` : 'Batch'; }
      default: return 'All Students';
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const published = announcements.filter(a => a.is_published).length;
  const drafts = announcements.filter(a => !a.is_published).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Announcements" description={`${announcements.length} total`} actions={
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"><Plus className="h-4 w-4" /> Create Announcement</button>
      } />

      <AdminSection title="Overview">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AdminStatCard label="Total" value={announcements.length} icon={Megaphone} iconColor="bg-brand-50 text-brand-600" />
          <AdminStatCard label="Published" value={published} icon={Send} iconColor="bg-emerald-50 text-emerald-600" />
          <AdminStatCard label="Drafts" value={drafts} icon={Pencil} iconColor="bg-amber-50 text-amber-600" />
        </div>
      </AdminSection>

      {error && <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-text-muted" /></div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted"><Megaphone className="mb-3 h-10 w-10" /><p className="text-sm font-medium">No announcements yet</p></div>
      ) : (
        <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-muted text-left text-xs font-medium text-text-secondary">
                  <th className="px-6 py-3">Title</th><th className="px-6 py-3">Target</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Created</th><th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((a) => (
                  <tr key={a.id} className="border-b border-surface-border hover:bg-surface-muted/50">
                    <td className="px-6 py-4 font-medium text-text-primary max-w-xs truncate">{a.title}</td>
                    <td className="px-6 py-4 text-text-secondary">{targetLabel(a)}</td>
                    <td className="px-6 py-4"><Badge variant={a.is_published ? 'success' : 'neutral'}>{a.is_published ? 'Published' : 'Draft'}</Badge></td>
                    <td className="px-6 py-4 text-text-secondary whitespace-nowrap">{formatDate(a.created_at)}</td>
                    <td className="px-6 py-4 text-right"><Button variant="ghost" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => openEdit(a)}>Edit</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Announcement' : 'Create Announcement'} size="lg"
        footer={<div className="flex gap-3"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit" form="announcement-form" loading={submitting}>{editingId ? 'Update' : 'Create'}</Button></div>}>
        <form id="announcement-form" onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-xs font-medium text-text-secondary mb-1">Title *</label><input required value={form.title} onChange={e => setForm({...form, title:e.target.value})} className="input-field text-sm" /></div>
          <div><label className="block text-xs font-medium text-text-secondary mb-1">Message *</label><textarea required value={form.message} onChange={e => setForm({...form, message:e.target.value})} rows={4} className="input-field text-sm" /></div>
          <div><label className="block text-xs font-medium text-text-secondary mb-1">Target Audience</label>
            <select value={form.targetType} onChange={e => setForm({...form, targetType: e.target.value as any, targetId: ''})} className="rounded-xl border border-surface-border bg-white px-4 py-2.5 text-sm w-full">
              <option value="all">All Students</option><option value="course">Specific Course</option><option value="batch">Specific Batch</option>
            </select>
          </div>
          {form.targetType === 'course' && <div><label className="block text-xs font-medium text-text-secondary mb-1">Course</label><select value={form.targetId} onChange={e => setForm({...form, targetId:e.target.value})} className="rounded-xl border border-surface-border bg-white px-4 py-2.5 text-sm w-full"><option value="">Select...</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>}
          {form.targetType === 'batch' && <div><label className="block text-xs font-medium text-text-secondary mb-1">Batch</label><select value={form.targetId} onChange={e => setForm({...form, targetId:e.target.value})} className="rounded-xl border border-surface-border bg-white px-4 py-2.5 text-sm w-full"><option value="">Select...</option>{batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={e => setForm({...form, isPublished:e.target.checked})} className="rounded border-surface-border" /> Publish immediately</label>
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
        </form>
      </Modal>
    </div>
  );
}
