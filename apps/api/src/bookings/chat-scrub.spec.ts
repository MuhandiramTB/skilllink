import { scrubPhones } from './chat-scrub';

describe('chat phone scrub (Req 4.1 — call masking)', () => {
  it('hides Sri Lankan mobile numbers', () => {
    expect(scrubPhones('call me on +94771234567 please')).toBe('call me on [hidden] please');
    expect(scrubPhones('0771234567')).toBe('[hidden]');
    expect(scrubPhones('077-123-4567')).toBe('[hidden]');
  });

  it('leaves normal text untouched', () => {
    expect(scrubPhones('I will arrive at 5pm')).toBe('I will arrive at 5pm');
    expect(scrubPhones('unit 12, room 3')).toBe('unit 12, room 3');
  });
});
