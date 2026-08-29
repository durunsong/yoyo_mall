import { mergeNotificationReadStates } from './read-state';

describe('mergeNotificationReadStates', () => {
  it('uses persisted read state for generated notifications', () => {
    expect(
      mergeNotificationReadStates(
        [
          { id: 'order-1', read: false },
          { id: 'order-2', read: false },
        ],
        new Map([
          ['order-1', { read: true }],
          ['order-2', { read: false }],
        ]),
      ),
    ).toEqual([
      { id: 'order-1', read: true },
      { id: 'order-2', read: false },
    ]);
  });

  it('keeps generated notifications unread when no persisted state exists', () => {
    expect(
      mergeNotificationReadStates([{ id: 'system-1', read: false }], new Map()),
    ).toEqual([{ id: 'system-1', read: false }]);
  });

  it('removes notifications that were dismissed by the user', () => {
    expect(
      mergeNotificationReadStates(
        [
          { id: 'order-1', read: false },
          { id: 'order-2', read: false },
        ],
        new Map([
          ['order-1', { read: false, dismissed: true }],
          ['order-2', { read: true, dismissed: false }],
        ]),
      ),
    ).toEqual([{ id: 'order-2', read: true }]);
  });
});
