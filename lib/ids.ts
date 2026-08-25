let fallbackCounter = 0;

export function uid(prefix: string): string {
  const bytes = new Uint8Array(12);
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) cryptoApi.getRandomValues(bytes);
  else {
    const stamp = Date.now() + fallbackCounter++;
    for (let index = 0; index < bytes.length; index++) {
      bytes[index] = (stamp >> ((index % 4) * 8)) & 0xff;
    }
  }
  const randomPart = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${Date.now().toString(36)}_${randomPart}`;
}