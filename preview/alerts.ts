// A disconnected provider is NOT evidence of an absence of official warnings.
export async function loadAlerts() { return { alerts: [], unavailable: true } }
export function activeAlerts() { return [] }
