export const ROUTES = {
  LOGIN: '/login',
  ADMIN: {
    HOME: '/admin',
    COURSES: '/admin/courses',
    RECORDINGS: '/admin/recordings',
    BULK_UPLOAD: '/admin/bulk-upload',
    PAYMENTS: '/admin/payments',
    BUSINESS_CONFIG: '/admin/business-config',
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
  },
  USERS: '/users',
  COURSES: '/courses',
  BATCHES: '/batches',
  LIVE_SESSIONS: '/live-sessions',
  ATTENDANCE: '/attendance',
  VIDEOS: '/videos',
  TESTS: '/tests',
  BULK_UPLOAD: '/bulk-upload',
  PAYMENTS: {
    PLANS: '/payments/plans',
    MY: '/payments/my',
    INSTALLMENTS: '/payments/installments',
  },
  EMAIL: '/email/test',
  INVOICES: '/invoices',
} as const;
