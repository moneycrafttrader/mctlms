import { notFound } from 'next/navigation';
import { getBatch } from '@/lib/api/courses';
import { BatchDetailView } from '@/components/admin/batches/batch-detail-view';

export const dynamic = 'force-dynamic';

export default async function AdminBatchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    const batch = await getBatch(params.id);
    return <BatchDetailView batch={batch} />;
  } catch {
    notFound();
  }
}
