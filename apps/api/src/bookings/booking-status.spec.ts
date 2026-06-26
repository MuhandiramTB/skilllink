import { canTransition } from './booking-status';

describe('Booking state machine (Spec §2)', () => {
  it('allows the happy path', () => {
    expect(canTransition('requested', 'matched')).toBe(true);
    expect(canTransition('matched', 'accepted')).toBe(true);
    expect(canTransition('accepted', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'completed')).toBe(true);
  });

  it('allows reject (matched→requested) and cancel paths', () => {
    expect(canTransition('matched', 'requested')).toBe(true);
    expect(canTransition('requested', 'cancelled')).toBe(true);
    expect(canTransition('accepted', 'cancelled')).toBe(true);
  });

  it('rejects illegal jumps', () => {
    expect(canTransition('requested', 'completed')).toBe(false);
    expect(canTransition('requested', 'in_progress')).toBe(false);
    expect(canTransition('completed', 'in_progress')).toBe(false);
    expect(canTransition('cancelled', 'requested')).toBe(false);
    expect(canTransition('in_progress', 'cancelled')).toBe(false);
  });
});
