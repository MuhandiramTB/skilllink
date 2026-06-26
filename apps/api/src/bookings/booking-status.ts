export type BookingStatus =
  | 'requested'
  | 'matched'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled';

/** Legal transitions (Spec §2 state machine). */
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  requested: ['matched', 'cancelled'],
  matched: ['accepted', 'requested', 'cancelled'], // reject → back to requested
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  rejected: [],
  cancelled: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}
