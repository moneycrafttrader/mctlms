import { createClient } from '@/lib/supabase/server';
import { fetchApi } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProfileClient } from './profile-client';

export const dynamic = 'force-dynamic';

export default async function StudentProfilePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const email = session?.user?.email ?? '';
  let batchNames: string[] = [];

  if (token) {
    try {
      const batches: any = await fetchApi(`${API_ROUTES.USERS}/me/batches`, { token });
      batchNames = (Array.isArray(batches) ? batches : []).map((b: any) => b.name);
    } catch {
      // API unavailable
    }
  }

  return (
    <div>
      <PageHeader title="Profile" />
      <div className="px-4 md:px-0">
        <ProfileClient email={email} batchNames={batchNames} />
      </div>
    </div>
  );
}
