'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react';
import { uploadStudentsCsv } from '@/lib/api/bulk-upload';

interface FileDropzoneProps {
  onUploadSuccess: () => void;
  token?: string;
}

export function FileDropzone({ onUploadSuccess, token }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<{
    totalRows: number;
    successCount: number;
    failureCount: number;
  } | null>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setError('');
      setSummary(null);
      setIsUploading(true);

      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
        setError('Please upload a .csv or .xlsx file');
        setIsUploading(false);
        return;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadStudentsCsv(formData, token);
        setSummary({
          totalRows: result.totalRows,
          successCount: result.successCount,
          failureCount: result.failureCount,
        });
        onUploadSuccess();
      } catch (err: any) {
        setError(err.message || 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    },
    [token, onUploadSuccess],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
      if (inputRef.current) inputRef.current.value = '';
    },
    [handleUpload],
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Upload Students</h2>
      <p className="mb-4 text-sm text-gray-500">
        Upload a CSV or Excel file with columns: <strong>Name</strong>,{' '}
        <strong>Email</strong>, <strong>Phone</strong> (optional).
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
          isDragging
            ? 'border-brand-500 bg-brand-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={onFileSelect}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <p className="text-sm font-medium">Uploading & processing...</p>
          </div>
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              Drop your file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Supports .csv and .xlsx files
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {summary && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Upload complete
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-lg font-bold text-gray-900">{summary.totalRows}</p>
              <p className="text-xs text-gray-500">Total Rows</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">
                {summary.successCount}
              </p>
              <p className="text-xs text-gray-500">Success</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-600">
                {summary.failureCount}
              </p>
              <p className="text-xs text-gray-500">Failures</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
