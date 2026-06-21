import { getBulkUploadJobs } from '@/lib/api/bulk-upload';
import { BulkUploadClient } from '@/components/admin/bulk-upload/bulk-upload-client';

export const dynamic = 'force-dynamic';

export default async function AdminBulkUploadPage() {
  let initialJobs: any[] = [];

  try {
    initialJobs = await getBulkUploadJobs();
  } catch {
    // API unavailable
  }

  return <BulkUploadClient initialJobs={initialJobs} />;
}
