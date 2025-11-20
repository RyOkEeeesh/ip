export function isIpv4(ip: string) {
  const regex =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  return regex.test(ip);
}

export function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
}

export function intToIpv4(ip: number): string {
  return [24, 16, 8, 0].map(s => (ip >> s) & 255).join('.');
}

export function maskFromLen(len: number): number {
  return (0xffffffff << (32 - len)) >>> 0;
}

export function minMaskFromIpNetwork(ip: number, network: number): number {
  for (let i = 0; i <= 32; i++) {
    const mask = maskFromLen(i)
    if (networkFromIpMask(ip, maskFromLen(i)) === network)
      return mask;
  }
  return -1;
}

export function lenFromMask(mask: number): number | null {
  if (mask === -1) return null;

  const inverted = ~mask >>> 0;
  if ((inverted & (inverted + 1)) !== 0) return null;

  let len = 0;
  for (let i = 31; i >= 0; i--) {
    if ((mask & (1 << i)) !== 0) len++;
    else break;
  }
  return len;
}

export function networkFromIpMask(ip: number, mask: number): number {
  return ip & mask;
}