import { cookies } from 'next/headers';
import { fetchApi } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProfileClient } from './profile-client';
import { DeviceList } from '@/components/shared/DeviceList';

export const dynamic = 'force-dynamic';

export default async function StudentProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  let email = '';
  let batchNames: string[] = [];

  if (token) {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString(),
      );
      email = payload.email ?? '';
    } catch {
      // JWT decode failed
    }
    try {
      const batches: any = await fetchApi(`${API_ROUTES.USERS}/me/batches`);
      batchNames = (Array.isArray(batches) ? batches : []).map((b: any) => b.name);
    } catch {
      // API unavailable
    }
  }

  return (
    <div>
      <PageHeader title="Profile" />
      <div className="space-y-4 px-4 md:px-0">
        <ProfileClient email={email} batchNames={batchNames} />
        <DeviceList />
      </div>
    </div>
  );
}
