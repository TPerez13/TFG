export async function syncLocalHabitReminders() {
  try {
    const notificationsApi = await import('./api');
    await notificationsApi.syncLocalNotificationsWithServer({ requestPermissions: false });
  } catch {
    // La sincronizacion local es best-effort y no debe romper el flujo principal.
  }
}
