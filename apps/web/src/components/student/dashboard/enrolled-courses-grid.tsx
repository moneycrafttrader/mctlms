'use client';

import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { type StudentCourse } from '@/lib/api/courses';

interface EnrolledCoursesGridProps {
  courses: StudentCourse[];
}

export function EnrolledCoursesGrid({ courses }: EnrolledCoursesGridProps) {
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16 text-gray-500">
        <BookOpen className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-lg font-medium">You are not enrolled in any courses yet.</p>
        <p className="mt-1 text-sm">Courses will appear here once you are added to a batch.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <div
          key={course.id}
          className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
            <BookOpen className="h-5 w-5 text-brand-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
            {course.name}
          </h3>
          {course.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {course.description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <span>
              {course.enrolledBatches?.length ?? 0} batch
              {(course.enrolledBatches?.length ?? 0) !== 1 ? 'es' : ''}
            </span>
          </div>
          <Link
            href={`/student/courses/${course.id}`}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-brand-600 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
          >
            Go to Course
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ))}
    </div>
  );
}
