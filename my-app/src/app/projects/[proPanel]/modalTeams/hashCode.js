export function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i) + 127;
        hash |= 0;
    }
    hash = String(hash).slice(4, 10)
    const r = Math.min(255, (((hash >> 16) & 0xFF)+210));
    const g = Math.min(255, (((hash >> 8) & 0xFF)+210));
    const b = (hash & 0xFF)+210;
    
    const r_ = Math.min(255, ((hash >> 16) & 0xFF))
    const g_ = Math.min(255, ((hash >> 8) & 0xFF))
    const b_ = Math.min(255, ((hash & 0xFF)))

    return [[r, g, b], [r_, g_, b_]]
  }