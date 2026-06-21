import { getSessionById, type LiveSessionWithDetails } from '@/lib/api/live-sessions';
import { PageHeader } from '@/components/shared/PageHeader';
import { LiveSessionClient } from './live-session-client';

export const dynamic = 'force-dynamic';

interface Props {
  params: { sessionId: string };
}

export default async function StudentLiveSessionPage({ params }: Props) {
  let session: LiveSessionWithDetails | null = null;

  try {
    session = await getSessionById(params.sessionId);
  } catch {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-text-primary">
            Session not found
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            This session may not exist or you may not have access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={session.topic} showBack />
      <div className="px-4 md:px-0">
        <LiveSessionClient session={session} />
      </div>
    </div>
  );
}
