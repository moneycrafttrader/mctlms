/*
 * Course Classroom Header — top section of the student course page
 *
 * Shows course name, description, and the student's batch name.
 */
import { BookOpen, Users } from 'lucide-react';

interface CourseClassroomHeaderProps {
  name: string;
  description?: string;
  batchName: string;
}

export function CourseClassroomHeader({ name, description, batchName }: CourseClassroomHeaderProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm mb-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <BookOpen className="h-6 w-6 text-brand-600" />
            {name}
          </h1>
          {description && (
            <p className="mt-2 max-w-3xl text-gray-600">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
          <Users className="h-4 w-4" />
          Batch: {batchName}
        </div>
      </div>
    </div>
  );
}
