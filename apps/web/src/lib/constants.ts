export const ROUTES = {
  LOGIN: '/login',
  CHANGE_PASSWORD: '/change-password',
  RESET_PASSWORD: '/reset-password',
  ADMIN: {
    HOME: '/admin',
    STUDENTS: '/admin/students',
    COURSES: '/admin/courses',
    RECORDINGS: '/admin/recordings',
    BULK_UPLOAD: '/admin/bulk-upload',
    PAYMENTS: '/admin/payments',
    BUSINESS_CONFIG: '/admin/business-config',
    SESSIONS: '/admin/sessions',
  },
  STUDENT: {
    HOME: '/student',
    COURSES: '/student/courses',
    LIVE_SESSIONS: '/student/live-sessions',
    VIDEOS: '/student/videos',
  },
} as const;

export const ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
  TEACHER: 'teacher',
} as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VALIDATE_SESSION: '/auth/validate-session',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  USERS: '/users',
  COURSES: '/courses',
  BATCHES: '/batches',
  LIVE_SESSIONS: '/live-sessions',
  ATTENDANCE: '/attendance',
  VIDEOS: '/videos',
  RECORDINGS: '/recordings',
  TESTS: '/tests',
  BULK_UPLOAD: '/bulk-upload',
  PAYMENTS: {
    PLANS: '/payments/plans',
    MY: '/payments/my',
    INSTALLMENTS: '/payments/installments',
  },
  EMAIL: '/email/test',
  INVOICES: '/invoices',
  ADMIN_SESSIONS: '/admin/sessions',
  ADMIN_RECORDINGS: '/admin/recordings',
  ADMIN_TOPICS: '/admin/topics',
  ADMIN_UPLOAD_URL: '/admin/upload-url',
  ZOOM_SIGNATURE: '/zoom/signature',
} as const;
