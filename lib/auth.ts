export function verifyQrSession(sessionToken: string | undefined, pathToken: string): boolean {
  if (!sessionToken) return false;
  return sessionToken === pathToken;
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
}
