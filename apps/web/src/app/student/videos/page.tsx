import { createClient } from '@/lib/supabase/server';
import { VideoLibrary } from '@/components/student/videos/video-library';

export const dynamic = 'force-dynamic';

export default async function StudentVideosPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Video Library</h1>
        <p className="mt-1 text-sm text-gray-500">
          Watch recorded lectures and course content.
        </p>
      </div>
      <VideoLibrary token={token} />
    </div>
  );
}
