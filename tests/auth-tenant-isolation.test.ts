import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { requireBusiness, requireCronAuth } from '@/lib/auth/requireBusiness';

describe('Authentication & Tenant Isolation Engine', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test_cron_secret_secure_123';
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
  });

  describe('requireCronAuth', () => {
    it('should authorize requests with valid x-cron-secret header', () => {
      const req = new Request('http://localhost:3000/api/hospital/cron/trigger/all', {
        method: 'POST',
        headers: {
          'x-cron-secret': 'test_cron_secret_secure_123',
        },
      });

      const auth = requireCronAuth(req);
      expect(auth.authorized).toBe(true);
      expect(auth.errorResponse).toBeNull();
    });

    it('should authorize requests with valid Bearer token matching cron secret', () => {
      const req = new Request('http://localhost:3000/api/hospital/cron/trigger/all', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test_cron_secret_secure_123',
        },
      });

      const auth = requireCronAuth(req);
      expect(auth.authorized).toBe(true);
      expect(auth.errorResponse).toBeNull();
    });

    it('should reject requests with invalid or missing cron secret', async () => {
      const reqNoSecret = new Request('http://localhost:3000/api/hospital/cron/trigger/all', {
        method: 'POST',
      });
      const authNoSecret = requireCronAuth(reqNoSecret);
      expect(authNoSecret.authorized).toBe(false);
      expect(authNoSecret.errorResponse?.status).toBe(401);

      const reqWrongSecret = new Request('http://localhost:3000/api/hospital/cron/trigger/all', {
        method: 'POST',
        headers: {
          'x-cron-secret': 'wrong_secret_attacker',
        },
      });
      const authWrongSecret = requireCronAuth(reqWrongSecret);
      expect(authWrongSecret.authorized).toBe(false);
      expect(authWrongSecret.errorResponse?.status).toBe(401);
    });
  });

  describe('requireBusiness in Production', () => {
    it('should reject unauthenticated requests in production environment', async () => {
      (process.env as any).NODE_ENV = 'production';

      const req = new Request('http://localhost:3000/api/hospital/doctors', {
        method: 'GET',
      });

      const auth = await requireBusiness(req);
      expect(auth.errorResponse).not.toBeNull();
      expect(auth.errorResponse?.status).toBe(401);
      expect(auth.businessId).toBeNull();
    });
  });
});
