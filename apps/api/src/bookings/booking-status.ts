export type BookingStatus =
  | 'requested'
  | 'matched'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'no_show';

/** Legal transitions (Spec §2 state machine + policy: no_show is terminal, only
 *  reachable from a matched/accepted job that never started). */
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  requested: ['matched', 'cancelled'],
  matched: ['accepted', 'requested', 'cancelled', 'no_show'], // reject → back to requested
  accepted: ['in_progress', 'cancelled', 'no_show'],
  in_progress: ['completed'],
  completed: [],
  rejected: [],
  cancelled: [],
  no_show: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}
