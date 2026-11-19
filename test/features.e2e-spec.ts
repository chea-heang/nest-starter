import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/exceptions/http-exception.filter';
import { ThrottlerExceptionFilter } from '../src/common/guards/throttler-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('Features E2E: Rate Limiting, Caching, and Tracing', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(
      new HttpExceptionFilter(),
      new ThrottlerExceptionFilter(),
    );
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Correlation ID Middleware', () => {
    it('should generate a new x-correlation-id header when none is provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/posts')
        .expect(200);

      expect(res.headers['x-correlation-id']).toBeDefined();
      expect(typeof res.headers['x-correlation-id']).toBe('string');
      expect(res.headers['x-correlation-id'].length).toBeGreaterThan(0);
    });

    it('should preserve and echo back an incoming x-correlation-id header', async () => {
      const customId = 'client-custom-trace-id-12345';
      const res = await request(app.getHttpServer())
        .get('/api/v1/posts')
        .set('x-correlation-id', customId)
        .expect(200);

      expect(res.headers['x-correlation-id']).toBe(customId);
    });
  });

  describe('Response Caching', () => {
    it('should cache GET /api/v1/posts and return X-Cache: HIT on subsequent requests', async () => {
      // First request -> Cache MISS
      const res1 = await request(app.getHttpServer())
        .get('/api/v1/posts')
        .expect(200);

      expect(res1.body.success).toBe(true);

      // Second immediate request -> Cache HIT
      const res2 = await request(app.getHttpServer())
        .get('/api/v1/posts')
        .expect(200);

      expect(res2.headers['x-cache']).toBe('HIT');
      expect(res2.body.data).toEqual(res1.body.data);
    });
  });

  describe('API Rate Limiting', () => {
    it('should rate limit sensitive auth endpoints after 10 requests with HTTP 429', async () => {
      // 10 requests within limit
      for (let i = 1; i <= 10; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: 'test@example.com', password: 'wrong' });
      }

      // 11th request should be throttled
      const throttledRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' })
        .expect(429);

      expect(throttledRes.body.success).toBe(false);
      expect(throttledRes.body.statusCode).toBe(429);
      expect(throttledRes.body.error).toBe('Too Many Requests');
      expect(throttledRes.body.message).toContain('Rate limit exceeded');
    });

    it('should skip rate limiting for @SkipThrottle endpoints', async () => {
      // Hitting @SkipThrottle route multiple times does not trigger 429
      for (let i = 1; i <= 12; i++) {
        const res = await request(app.getHttpServer()).get('/api/v1/auth/profile');
        expect(res.status).not.toBe(429);
      }
    });
  });
});
