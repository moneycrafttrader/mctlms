export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'instructor' | 'student';
  batchId?: string;
}

export interface Batch {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface LiveSession {
  id: string;
  title: string;
  batchId: string;
  scheduledAt: string;
  zoomMeetingId?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
}

export interface Video {
  id: string;
  title: string;
  batchId: string;
  muxAssetId?: string;
  playbackId?: string;
  status: 'processing' | 'ready' | 'failed';
}

export interface Test {
  id: string;
  title: string;
  batchId: string;
  questions: TestQuestion[];
}

export interface TestQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Attendance {
  sessionId: string;
  studentId: string;
  present: boolean;
  markedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}
