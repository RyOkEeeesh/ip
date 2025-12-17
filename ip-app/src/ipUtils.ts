export const IP_MIN = 0;
export const IP_MAX = 32;

type ipUtilsReturn = number | null;

export function isIpv4(ip: string) {
  const regex =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  return regex.test(ip);
}

export function isMask(mask: number): boolean {
  const inverted = ~mask >>> 0;
  if ((inverted & (inverted + 1)) !== 0) return false;
  return true;
}

export function ipv4ToInt(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
}

export function intToIpv4(ip: number): string {
  return [24, 16, 8, 0].map((s) => (ip >> s) & 255).join('.');
}

export function maskFromLen(len: number): ipUtilsReturn {
  if (len < IP_MIN || IP_MAX < len) return null;
  if (len === 0) return 0;
  return (0xffffffff << (IP_MAX - len)) >>> 0;
}

export function minMaskFromIpNetwork(
  ip: number,
  network: number,
): ipUtilsReturn {
  for (let i = IP_MIN; i <= IP_MAX; i++) {
    const mask = maskFromLen(i)!;
    if (networkFromIpMask(ip, mask) === network) return mask;
  }
  return null;
}

export function lenFromMask(mask: number): ipUtilsReturn {
  if (mask === -1) return null;
  if (!isMask(mask)) return null;
  return Math.clz32(~mask);
}

export function networkFromIpMask(ip: number, mask: number): number {
  return ip & mask;
}
