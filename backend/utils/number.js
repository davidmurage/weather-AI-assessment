export function toFloat(value) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}
