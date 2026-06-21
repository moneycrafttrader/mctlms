'use client';

import { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Upload, FileVideo, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getMuxUploadUrl } from '@/lib/api/videos';

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];

interface ManualUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type UploadState =
  | { phase: 'idle' }
  | { phase: 'requesting' }
  | { phase: 'uploading'; progress: number }
  | { phase: 'success' }
  | { phase: 'error'; message: string };

export function ManualUploadModal({ isOpen, onClose, onComplete }: ManualUploadModalProps) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>({ phase: 'idle' });
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const reset = () => {
    setTitle('');
    setFile(null);
    setState({ phase: 'idle' });
    xhrRef.current = null;
  };

  const handleClose = () => {
    if (state.phase === 'uploading') {
      xhrRef.current?.abort();
    }
    reset();
    onClose();
  };

  const isValid = title.trim().length >= 2 && file !== null;

  const handleUpload = async () => {
    if (!file || !isValid) return;

    setState({ phase: 'requesting' });

    try {
      const { uploadUrl } = await getMuxUploadUrl(title.trim());

      setState({ phase: 'uploading', progress: 0 });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setState({ phase: 'uploading', progress: pct });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });

      setState({ phase: 'success' });
      setTimeout(() => {
        reset();
        onComplete();
      }, 2500);
    } catch (err: any) {
      setState({ phase: 'error', message: err.message || 'Upload failed' });
    }
  };

  const isSubmitting = state.phase === 'requesting' || state.phase === 'uploading';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Video">
      <div className="space-y-5">
        {/* Title input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Video Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g. Introduction to Algebra"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-100"
          />
        </div>

        {/* File picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Video File <span className="text-red-500">*</span>
          </label>
          <label
            className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition-colors ${
              isSubmitting
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-brand-400 hover:bg-brand-50/30'
            }`}
          >
            {file ? (
              <div className="flex items-center gap-3">
                <FileVideo className="h-8 w-8 text-brand-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="mb-2 h-8 w-8 text-gray-400" />
                <p className="text-sm font-medium text-gray-600">
                  Click to select a video file
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  MP4, MOV, AVI, MKV, or WebM
                </p>
              </>
            )}
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              disabled={isSubmitting}
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {/* Progress / Status */}
        {state.phase === 'requesting' && (
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Requesting upload URL...
          </div>
        )}

        {state.phase === 'uploading' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Uploading...</span>
              <span className="font-semibold text-brand-600">{state.progress}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-2.5 rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>
        )}

        {state.phase === 'success' && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Upload complete! Video will appear in the table once Mux finishes processing.
          </div>
        )}

        {state.phase === 'error' && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {state.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {state.phase === 'uploading' ? 'Cancel' : 'Close'}
          </button>
          {state.phase !== 'success' && (
            <button
              onClick={handleUpload}
              disabled={!isValid || isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {state.phase === 'requesting' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Requesting...
                </>
              ) : state.phase === 'uploading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading {state.progress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Start Upload
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
