'use client';

import { useState, useCallback } from 'react';
import { FileDropzone } from './file-dropzone';
import { JobsHistory } from './jobs-history';
import { getBulkUploadJobs, type BulkUploadJob } from '@/lib/api/bulk-upload';

interface BulkUploadClientProps {
  initialJobs: BulkUploadJob[];
}

export function BulkUploadClient({ initialJobs }: BulkUploadClientProps) {
  const [jobs, setJobs] = useState<BulkUploadJob[]>(initialJobs);

  const refresh = useCallback(async () => {
    try {
      const updated = await getBulkUploadJobs();
      setJobs(updated);
    } catch {
      // silent
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Upload</h1>
        <p className="mt-1 text-sm text-gray-500">
          Import multiple student accounts at once using a CSV or Excel file.
        </p>
      </div>

      <FileDropzone onUploadSuccess={refresh} />
      <JobsHistory jobs={jobs} />
    </div>
  );
}
