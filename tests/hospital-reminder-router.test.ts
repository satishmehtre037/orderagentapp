import { describe, it, expect } from 'vitest';

describe('Hospital WhatsApp 1/2/3 Reminder Action Regex Matchers', () => {
  const confirmRegex = /^(1|confirm|confirmed|yes|haan|ha|theek|ok|sure)$/i;
  const rescheduleRegex = /^(2|reschedule|change|badalna|shift|reshedule)$/i;
  const cancelRegex = /^(3|cancel|cancle|radd|nahi|cancel appointment)$/i;
  const ratingKeywordRegex = /(?:star|stars|rating|review|feedback|⭐)/i;

  it('should match Option 1 (Confirm) inputs accurately in English and Hindi', () => {
    expect(confirmRegex.test('1')).toBe(true);
    expect(confirmRegex.test('confirm')).toBe(true);
    expect(confirmRegex.test('yes')).toBe(true);
    expect(confirmRegex.test('haan')).toBe(true);
    expect(confirmRegex.test('ok')).toBe(true);

    expect(confirmRegex.test('2')).toBe(false);
    expect(confirmRegex.test('cancel')).toBe(false);
  });

  it('should match Option 2 (Reschedule) inputs accurately', () => {
    expect(rescheduleRegex.test('2')).toBe(true);
    expect(rescheduleRegex.test('reschedule')).toBe(true);
    expect(rescheduleRegex.test('change')).toBe(true);
    expect(rescheduleRegex.test('badalna')).toBe(true);

    expect(rescheduleRegex.test('1')).toBe(false);
    expect(rescheduleRegex.test('3')).toBe(false);
  });

  it('should match Option 3 (Cancel) inputs accurately', () => {
    expect(cancelRegex.test('3')).toBe(true);
    expect(cancelRegex.test('cancel')).toBe(true);
    expect(cancelRegex.test('cancle')).toBe(true);
    expect(cancelRegex.test('cancel appointment')).toBe(true);

    expect(cancelRegex.test('1')).toBe(false);
    expect(cancelRegex.test('confirm')).toBe(false);
  });

  it('should prevent plain "1" from triggering 1-star feedback review when rating keywords are absent', () => {
    const message = '1';
    // Single digit '1' without explicit rating keywords should NOT match review rating trigger
    const isExplicitReview = ratingKeywordRegex.test(message);
    expect(isExplicitReview).toBe(false);

    // But '1 star' or '1/5' does have review intent
    expect(ratingKeywordRegex.test('1 star')).toBe(true);
    expect(ratingKeywordRegex.test('gave 5 rating')).toBe(true);
  });
});
