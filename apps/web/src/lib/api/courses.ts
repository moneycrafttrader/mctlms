import { fetchApi } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

export interface Course {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  batchCount?: number;
  batches?: Batch[];
}

export interface CourseWithBatches extends Course {
  batches: Batch[];
}

export interface Batch {
  id: string;
  name: string;
  course_id: string;
  schedule_type: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface CourseStats {
  batchCount: number;
  studentCount: number;
  upcomingSessions: number;
}

/**
 * Fetch all courses with pagination.
 */
export async function getCourses(token?: string) {
  return fetchApi<{ items: Course[]; total: number; page: number; limit: number }>(
    API_ROUTES.COURSES,
    { token },
  );
}

/**
 * Fetch a single course by ID, including its nested batches.
 */
export async function getCourse(id: string, token?: string) {
  return fetchApi<CourseWithBatches>(`${API_ROUTES.COURSES}/${id}`, { token });
}

/**
 * Fetch stats for a single course.
 */
export async function getCourseStats(courseId: string, token?: string) {
  return fetchApi<CourseStats>(`${API_ROUTES.COURSES}/${courseId}/stats`, { token });
}

export interface StudentCourse extends Course {
  batches?: Batch[];
  enrolledBatches?: { id: string; name: string; course_id: string }[];
}

/**
 * Fetch courses for the currently logged-in student.
 * GET /courses/my
 */
export async function getMyCourses(token?: string) {
  return fetchApi<StudentCourse[]>(`${API_ROUTES.COURSES}/my`, { token });
}

/**
 * Fetch a single course by ID with enrolled batches (student classroom).
 * GET /courses/:id
 */
export async function getStudentCourse(id: string, token?: string) {
  return fetchApi<StudentCourse>(`${API_ROUTES.COURSES}/${id}`, { token });
}

/**
 * Fetch all batches belonging to a specific course.
 */
export async function getCourseBatches(courseId: string, token?: string) {
  return fetchApi<Batch[]>(`${API_ROUTES.COURSES}/${courseId}/batches`, { token });
}

/**
 * Create a new course.
 */
export async function createCourse(
  data: { name: string; description?: string },
  token?: string,
) {
  return fetchApi<Course>(API_ROUTES.COURSES, {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

/**
 * Create a batch under a course.
 */
export async function createBatch(
  courseId: string,
  data: { name: string; scheduleType: string },
  token?: string,
) {
  return fetchApi<Batch>(API_ROUTES.BATCHES, {
    method: 'POST',
    body: JSON.stringify({ courseId, ...data }),
    token,
  });
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface AddStudentResponse {
  id: string;
  name: string;
  email: string;
  alreadyExisted: boolean;
}

/**
 * Add a single student to a batch — creates auth user + profile if needed.
 * POST /batches/:id/add-student
 */
export async function addStudentToBatch(
  batchId: string,
  data: { firstName: string; lastName: string; email: string; phone?: string },
  token?: string,
) {
  return fetchApi<AddStudentResponse>(`${API_ROUTES.BATCHES}/${batchId}/add-student`, {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

/**
 * Fetch the student roster for a batch.
 * GET /batches/:id/students
 */
export async function getBatchStudents(
  batchId: string,
  token?: string,
  page?: number,
  limit?: number,
) {
  const params = new URLSearchParams();
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return fetchApi<{ items: StudentProfile[]; total: number; page: number; limit: number }>(
    `${API_ROUTES.BATCHES}/${batchId}/students${qs ? `?${qs}` : ''}`,
    { token },
  );
}

/**
 * Update a batch's name and/or schedule type.
 * PATCH /batches/:id
 */
export async function updateBatch(
  batchId: string,
  data: { name?: string; scheduleType?: string },
  token?: string,
) {
  return fetchApi<Batch>(`${API_ROUTES.BATCHES}/${batchId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  });
}

/**
 * Delete a batch.
 * DELETE /batches/:id
 */
export async function deleteBatch(
  batchId: string,
  token?: string,
) {
  return fetchApi<{ deleted: boolean }>(`${API_ROUTES.BATCHES}/${batchId}`, {
    method: 'DELETE',
    token,
  });
}

/**
 * Reassign a batch to a different course.
 * PATCH /batches/:batchId/reassign-course { courseId }
 */
export async function reassignBatch(
  batchId: string,
  targetCourseId: string,
  token?: string,
) {
  return fetchApi<Batch>(`${API_ROUTES.BATCHES}/${batchId}/reassign-course`, {
    method: 'PATCH',
    body: JSON.stringify({ courseId: targetCourseId }),
    token,
  });
}
