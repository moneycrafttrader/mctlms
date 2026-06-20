import { createClient } from '@/lib/supabase/server';
import { getBulkUploadJobs } from '@/lib/api/bulk-upload';
import { BulkUploadClient } from '@/components/admin/bulk-upload/bulk-upload-client';

export const dynamic = 'force-dynamic';

export default async function AdminBulkUploadPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  let initialJobs: any[] = [];

  try {
    initialJobs = await getBulkUploadJobs(token);
  } catch {
    // API unavailable
  }

  return <BulkUploadClient initialJobs={initialJobs} token={token} />;
}
