import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { ZoomService } from './../src/modules/zoom/zoom.service';
import { SupabaseService } from './../src/common/services/supabase.service';

describe('Admin Features (e2e)', () => {
  let app: INestApplication;
  let zoomService = {
    createWebinar: jest.fn(),
    deleteWebinar: jest.fn(),
  };
  let createdSessionId: string | undefined;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ZoomService)
      .useValue(zoomService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    const dbService = app.get(SupabaseService);

    // Failsafe: wipe test session if it survived the DELETE test
    if (createdSessionId) {
      await dbService.client.from('session_batch_mappings').delete().eq('session_id', createdSessionId);
      await dbService.client.from('sessions').delete().eq('id', createdSessionId);
    }

    // Failsafe: clean up student created by bulk upload test
    await dbService.client.from('users').delete().eq('email', 'test@test.com');

    await app.close();
  });

  // ---------------------------------------------------------
  // 1. BULK UPLOAD PIPELINE
  // ---------------------------------------------------------
  describe('Bulk Upload', () => {
    it('/bulk-upload/template (GET) - Should download CSV template', () => {
      return request(app.getHttpServer())
        .get('/bulk-upload/template')
        .expect(200)
        .expect('Content-Type', /text\/csv/)
        .expect('Content-Disposition', /attachment; filename="student_upload_template.csv"/);
    });

    it('/bulk-upload/students (POST) - Should accept multipart/form-data CSV', () => {
      const csvBuffer = Buffer.from('name,email,phone\nTest User,test@test.com,1234567890');

      return request(app.getHttpServer())
        .post('/bulk-upload/students')
        .set('Authorization', `Bearer YOUR_TEST_ADMIN_TOKEN`)
        .attach('file', csvBuffer, 'test.csv')
        .expect(201)
        .then((response) => {
          expect(response.body.success).toBe(true);
        });
    });
  });

  // ---------------------------------------------------------
  // 2. ZOOM WEBHOOK & ATTENDANCE PIPELINE
  // ---------------------------------------------------------
  describe('Zoom Webhooks', () => {
    it('/zoom/webhook (POST) - Should handle endpoint validation', () => {
      return request(app.getHttpServer())
        .post('/zoom/webhook')
        .send({
          event: 'endpoint.url_validation',
          payload: { plainToken: 'test-plain-token' },
        })
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('plainToken', 'test-plain-token');
          expect(response.body).toHaveProperty('encryptedToken');
        });
    });

    it('/zoom/webhook (POST) - Should process attendance silently', () => {
      return request(app.getHttpServer())
        .post('/zoom/webhook')
        .send({
          event: 'webinar.participant_joined',
          payload: {
            object: {
              id: '12345',
              participant: { user_email: 'test@test.com', join_time: '2026-06-21T10:00:00Z' },
            },
          },
        })
        .expect(200);
    });
  });

  // ---------------------------------------------------------
  // 3. LIVE SESSION MANAGEMENT
  // ---------------------------------------------------------
  describe('Live Sessions', () => {
    it('/admin/sessions (POST) - Should create a dynamic session', async () => {
      zoomService.createWebinar.mockResolvedValue({
        webinarId: '987654321',
        joinUrl: 'https://zoom.us/j/987654321',
        startUrl: 'https://zoom.us/s/987654321',
      });

      const res = await request(app.getHttpServer())
        .post('/admin/sessions')
        .set('Authorization', `Bearer YOUR_TEST_ADMIN_TOKEN`)
        .send({
          title: 'E2E Test Session',
          startTime: '2026-06-22T10:00:00Z',
          durationMinutes: 300,
          batchIds: [],
        })
        .expect(201);

      expect(zoomService.createWebinar).toHaveBeenCalled();
      createdSessionId = res.body.id;
      expect(createdSessionId).toBeDefined();
    });

    it('/admin/sessions/:id (DELETE) - Should delete from Zoom and DB', async () => {
      expect(createdSessionId).toBeDefined();

      zoomService.deleteWebinar.mockResolvedValue(true);

      await request(app.getHttpServer())
        .delete(`/admin/sessions/${createdSessionId}`)
        .set('Authorization', `Bearer YOUR_TEST_ADMIN_TOKEN`)
        .expect(200);

      expect(zoomService.deleteWebinar).toHaveBeenCalled();
    });
  });
});
