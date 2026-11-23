'use client';

import { ReviewQueueView } from '@/components/features/assessments/review-queue-view';

export default function TeacherReviewQueuePage() {
  return (
    <ReviewQueueView
      title="Review queue"
      description="Grade subjective test answers for your students"
    />
  );
}