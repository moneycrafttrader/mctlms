'use client';

import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { type StudentCourse } from '@/lib/api/courses';

interface Props {
  courses: StudentCourse[];
}

export function DashboardCourses({ courses }: Props) {
  if (courses.length === 0) {
    return (
      <div className="rounded-card border-2 border-dashed border-surface-border p-8 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-text-muted" />
        <p className="mt-2 text-sm font-medium text-text-primary">
          No enrolled courses yet
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          Courses will appear once you are added to a batch.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        My Courses
      </h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/student/courses/${course.id}`}
            className="rounded-card border border-surface-border bg-surface-card p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-navy/10">
                <BookOpen className="h-5 w-5 text-brand-navy" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-text-primary truncate">
                  {course.name}
                </h4>
                {course.enrolledBatches && course.enrolledBatches.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {course.enrolledBatches.map((b) => (
                      <span
                        key={b.id}
                        className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-text-secondary"
                      >
                        {b.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-text-muted" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
