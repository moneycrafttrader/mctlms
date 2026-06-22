export const EMAIL_TEMPLATES = {
  RECEIPT: 'receipt',
  INVOICE: 'invoice',
  CERTIFICATE: 'certificate',
  PASSWORD_RESET: 'password_reset',
  ANNOUNCEMENT: 'announcement',
  NOTIFICATION: 'notification',
  WELCOME: 'welcome',
  LOGIN_ALERT: 'login_alert',
  TEST_RESULT: 'test_result',
} as const;

export type EmailTemplateName = (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES];
