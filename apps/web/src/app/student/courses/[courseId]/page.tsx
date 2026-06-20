/*
 * Student Course Classroom — video player + library for a single course
 *
 * Data flow:
 *   1. Gets the user session from Supabase
 *   2. Fetches the course (with batches) from the API
 *   3. Finds which batch the student is enrolled in for this course
 *   4. Fetches ready videos assigned to that batch
 *   5. Renders the header + video theater
 */
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getStudentCourse } from '@/lib/api/courses';
import { getBatchVideos } from '@/lib/api/videos';
import { CourseClassroomHeader } from '@/components/student/courses/course-classroom-header';
import { VideoTheater } from '@/components/student/courses/video-theater';

export const dynamic = 'force-dynamic';

interface Props {
  params: { courseId: string };
}

export default async function StudentCoursePage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    redirect('/login');
  }

  try {
    const course = await getStudentCourse(params.courseId, token);

    const enrolledBatches = (course as any).enrolledBatches ?? [];
    const batches = (course as any).batches ?? [];
    if (enrolledBatches.length === 0) {
      return (
        <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
          <p className="mt-2 text-gray-600">
            You are not assigned to an active batch for this course.
          </p>
        </div>
      );
    }

    const batch = enrolledBatches[0];

    const [videos] = await Promise.all([
      getBatchVideos(batch.id, token),
    ]);

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CourseClassroomHeader
          name={course.name}
          description={(course as any).description}
          batchName={batch.name}
        />
        <VideoTheater videos={videos} />
      </div>
    );
  } catch {
    return (
      <div className="mt-12 p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Failed to load classroom
        </h2>
        <p className="mt-2 text-gray-500">
          Please try refreshing the page or contact support.
        </p>
      </div>
    );
  }
}
