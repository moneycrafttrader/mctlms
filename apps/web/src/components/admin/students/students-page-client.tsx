'use client';

import { useState, useCallback } from 'react';
import {
  Users,
  Plus,
  UserPlus,
  Upload,
  Loader2,
  Search,
  X,
  CheckCircle,
  XCircle,
  Link2,
} from 'lucide-react';
import {
  type User,
  getStudents,
  createUser,
} from '@/lib/api/users';
import { FileDropzone } from '@/components/admin/bulk-upload/file-dropzone';
import { AssignBatchModal } from './assign-batch-modal';

interface StudentsPageClientProps {
  initialStudents: User[];
  initialTotal: number;
  token?: string;
}

export function StudentsPageClient({
  initialStudents,
  initialTotal,
  token,
}: StudentsPageClientProps) {
  const [students, setStudents] = useState<User[]>(initialStudents);
  const [total, setTotal] = useState(initialTotal);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTab, setAddTab] = useState<'single' | 'bulk'>('single');
  const [search, setSearch] = useState('');

  // Single-add form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addError, setAddError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Assign batch modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargets, setAssignTargets] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      const result = await getStudents(token);
      setStudents(result.items);
      setTotal(result.total);
    } catch {
      // silent
    }
  }, [token]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setAddError('');
  };

  const handleSingleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setSubmitting(true);
    try {
      await createUser(
        {
          name: `${firstName} ${lastName}`.trim(),
          email,
          role: 'student',
          phone: phone || undefined,
        },
        token,
      );
      resetForm();
      setShowAddModal(false);
      refresh();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create student');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    }
  };

  const openAssignSingle = (studentId: string, studentName: string) => {
    setAssignTargets([studentId]);
    setShowAssignModal(true);
  };

  const openAssignBulk = () => {
    setAssignTargets(Array.from(selectedIds));
    setShowAssignModal(true);
  };

  const filtered = search
    ? students.filter(
        (s) =>
          s.name?.toLowerCase().includes(search.toLowerCase()) ||
          s.email?.toLowerCase().includes(search.toLowerCase()),
      )
    : students;

  const hasSelection = selectedIds.size > 0;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Students</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} student{total !== 1 ? 's' : ''} enrolled
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetForm();
              setAddTab('single');
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {hasSelection && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-brand-50 px-4 py-3 text-sm">
          <span className="font-medium text-brand-700">
            {selectedIds.size} student{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={openAssignBulk}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            <Link2 className="h-3.5 w-3.5" />
            Assign to Batch
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-gray-500 hover:text-gray-700"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium">No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Current Batches</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr
                    key={student.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 ${
                      selectedIds.has(student.id) ? 'bg-brand-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{student.email}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {student.phone || '\u2014'}
                    </td>
                    <td className="px-6 py-4">
                      {student.batches && student.batches.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {student.batches.map((b) => (
                            <span
                              key={b.id}
                              className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                            >
                              {b.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">&mdash;</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openAssignSingle(student.id, student.name)}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Add Student</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setAddTab('single')}
                className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium ${
                  addTab === 'single'
                    ? 'border-b-2 border-brand-600 text-brand-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                Add Single
              </button>
              <button
                onClick={() => setAddTab('bulk')}
                className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium ${
                  addTab === 'bulk'
                    ? 'border-b-2 border-brand-600 text-brand-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Upload className="h-4 w-4" />
                Bulk Upload
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {addTab === 'single' ? (
                <form onSubmit={handleSingleAdd} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">First Name</label>
                      <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Last Name</label>
                      <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Email</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Phone (optional)</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  </div>
                  {addError && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      <XCircle className="h-4 w-4 flex-shrink-0" />
                      {addError}
                    </div>
                  )}
                  <button type="submit" disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {submitting ? 'Creating...' : 'Create Student'}
                  </button>
                </form>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Upload a CSV or Excel file with student details.
                    </p>
                    <a
                      href="/student-template.csv"
                      download
                      className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download Template
                    </a>
                  </div>
                  <FileDropzone onUploadSuccess={refresh} token={token} />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign to Batch Modal */}
      <AssignBatchModal
        isOpen={showAssignModal}
        studentIds={assignTargets}
        studentLabel={
          assignTargets.length === 1
            ? `${students.find((s) => s.id === assignTargets[0])?.name ?? ''}`
            : `${assignTargets.length} students selected`
        }
        onClose={() => {
          setShowAssignModal(false);
          setAssignTargets([]);
        }}
        onSuccess={() => {
          setSelectedIds(new Set());
          refresh();
        }}
        token={token}
      />
    </div>
  );
}
