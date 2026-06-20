'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Calendar, Clock, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { getAllBatches, type Batch } from '@/lib/api/courses';
import { scheduleSession } from '@/lib/api/sessions';

interface ScheduleSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
}

const formSchema = z.object({
  batchId: z.string().min(1, 'Please select a batch'),
  title: z.string().min(3, 'Meeting topic must be at least 3 characters'),
  startDate: z.string().min(1, 'Please select a date'),
  startTime: z.string().min(1, 'Please select a time'),
  duration: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export function ScheduleSessionModal({
  isOpen,
  onClose,
  token,
}: ScheduleSessionModalProps) {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      batchId: '',
      title: '',
      startDate: '',
      startTime: '',
      duration: '60',
    },
  });

  const fetchBatches = useCallback(async () => {
    setLoadingBatches(true);
    setFetchError('');
    try {
      const result = await getAllBatches({ isActive: true, limit: 200 }, token);
      setBatches(result.items);
    } catch {
      setFetchError('Failed to load batches');
    } finally {
      setLoadingBatches(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      reset();
      setFetchError('');
      fetchBatches();
    }
  }, [isOpen, reset, fetchBatches]);

  const onSubmit = async (data: FormValues) => {
    try {
      const startTime = new Date(`${data.startDate}T${data.startTime}`);
      await scheduleSession(
        {
          title: data.title,
          startTime: startTime.toISOString(),
          batchId: data.batchId,
        },
        token,
      );
      toast.success('Class scheduled successfully');
      onClose();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule class');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Schedule Live Class</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
          {fetchError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {fetchError}
            </div>
          )}

          {/* Batch */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Batch <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                {...register('batchId')}
                disabled={loadingBatches}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">
                  {loadingBatches ? 'Loading batches...' : 'Select a batch'}
                </option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.batchId && (
              <p className="mt-1 text-xs text-red-500">{errors.batchId.message}</p>
            )}
          </div>

          {/* Meeting Topic */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Meeting Topic <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              placeholder="e.g. Nifty Options Strategy"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  {...register('startDate')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pl-10 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              {errors.startDate && (
                <p className="mt-1 text-xs text-red-500">{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  {...register('startTime')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pl-10 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              {errors.startTime && (
                <p className="mt-1 text-xs text-red-500">{errors.startTime.message}</p>
              )}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Duration (minutes)
            </label>
            <input
              type="number"
              {...register('duration')}
              min={15}
              max={480}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {errors.duration && (
              <p className="mt-1 text-xs text-red-500">{errors.duration.message}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Scheduling...' : 'Schedule Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
