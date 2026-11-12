// IPv4 CIDR matching for the campus-network check. Addresses such as "::ffff:10.1.2.3"
// (IPv4 inside IPv6, as Express reports them) are normalised first.

const normalise = (ip = '') => {
  const v = String(ip).trim();
  return v.startsWith('::ffff:') ? v.slice(7) : v;
};

const ipv4ToInt = (ip) => {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const b = Number(p);
    if (!Number.isInteger(b) || b < 0 || b > 255) return null;
    n = n * 256 + b;
  }
  return n >>> 0;
};

// True when `ip` is inside one of `ranges`. A range is "a.b.c.d/nn" or a single address.
const inRanges = (ip, ranges) => {
  const addr = normalise(ip);
  const n = ipv4ToInt(addr);
  for (const range of ranges) {
    if (!range.includes('/')) {
      if (range === addr || range === ip) return true;
      continue;
    }
    const [base, bitsText] = range.split('/');
    const bits = Number(bitsText);
    const b = ipv4ToInt(base);
    if (n === null || b === null || !Number.isInteger(bits) || bits < 0 || bits > 32) continue;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    if (((n & mask) >>> 0) === ((b & mask) >>> 0)) return true;
  }
  return false;
};

module.exports = { inRanges, normalise };
