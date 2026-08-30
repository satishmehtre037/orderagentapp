import { describe, it, expect } from 'vitest';

describe('OPD Token Progression, Double-Booking & PostgREST Sanitization', () => {
  describe('Sequential Token Calculation', () => {
    it('should increment token sequentially per doctor per day', () => {
      // Mock existing highest token
      const computeNextToken = (highestToken: number | null | undefined): number => {
        return (highestToken || 0) + 1;
      };

      expect(computeNextToken(null)).toBe(1);
      expect(computeNextToken(undefined)).toBe(1);
      expect(computeNextToken(0)).toBe(1);
      expect(computeNextToken(1)).toBe(2);
      expect(computeNextToken(16)).toBe(17);
      expect(computeNextToken(39)).toBe(40);
    });
  });

  describe('Double Booking Guard', () => {
    it('should detect conflicting appointment for same doctor and slot time', () => {
      interface Appointment {
        doctor_name: string;
        slot_time: string;
        status: string;
      }

      const existingAppointments: Appointment[] = [
        {
          doctor_name: 'Dr. Sarah Jenkins',
          slot_time: '2026-08-30T14:00:00.000Z',
          status: 'confirmed',
        },
        {
          doctor_name: 'Dr. Rajesh Gupta',
          slot_time: '2026-08-30T14:00:00.000Z',
          status: 'confirmed',
        },
        {
          doctor_name: 'Dr. Sarah Jenkins',
          slot_time: '2026-08-30T15:00:00.000Z',
          status: 'cancelled',
        },
      ];

      const isSlotConflicted = (doctor: string, slot: string): boolean => {
        return existingAppointments.some(
          (a) => a.doctor_name === doctor && a.slot_time === slot && a.status !== 'cancelled'
        );
      };

      // Exact same slot with Dr. Sarah Jenkins -> Conflicted!
      expect(isSlotConflicted('Dr. Sarah Jenkins', '2026-08-30T14:00:00.000Z')).toBe(true);

      // Same slot but different doctor (Dr. Priya) -> Allowed!
      expect(isSlotConflicted('Dr. Priya Sharma', '2026-08-30T14:00:00.000Z')).toBe(false);

      // Slot was cancelled with Dr. Sarah Jenkins -> Allowed to re-book!
      expect(isSlotConflicted('Dr. Sarah Jenkins', '2026-08-30T15:00:00.000Z')).toBe(false);

      // New time slot -> Allowed!
      expect(isSlotConflicted('Dr. Sarah Jenkins', '2026-08-30T16:00:00.000Z')).toBe(false);
    });
  });

  describe('PostgREST Search Filter Sanitization', () => {
    it('should strip special characters and injection payloads from search string', () => {
      const sanitizeSearch = (raw: string): string => {
        return raw.replace(/[^a-zA-Z0-9\s+\-_]/g, '').trim();
      };

      expect(sanitizeSearch('Satish')).toBe('Satish');
      expect(sanitizeSearch('Dr. Sarah')).toBe('Dr Sarah');
      expect(sanitizeSearch('9876543210')).toBe('9876543210');

      // Injection attempts with PostgREST syntax
      const injectionAttempt = 'Satish,id.neq.0,status.eq.active';
      const clean = sanitizeSearch(injectionAttempt);
      expect(clean).toBe('Satishidneq0statuseqactive');
      expect(clean).not.toContain(',');
      expect(clean).not.toContain('.');
      expect(clean).not.toContain('(');
      expect(clean).not.toContain(')');
    });
  });
});
