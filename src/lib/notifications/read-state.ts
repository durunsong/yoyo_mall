export interface NotificationReadState {
  read: boolean;
  dismissed?: boolean;
}

export function mergeNotificationReadStates<
  T extends { id: string; read: boolean },
>(
  notifications: T[],
  persisted: ReadonlyMap<string, NotificationReadState>,
): T[] {
  return notifications.reduce<T[]>((active, notification) => {
    const state = persisted.get(notification.id);
    if (state?.dismissed) return active;
    active.push({
      ...notification,
      read: state?.read ?? notification.read,
    });
    return active;
  }, []);
}
