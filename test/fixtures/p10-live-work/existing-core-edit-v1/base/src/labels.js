export function normalizeLabel(value) {
  if (typeof value !== 'string') throw new TypeError('label must be a string');
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '-');
  if (!normalized) throw new RangeError('label must not be blank');
  return normalized;
}
