export const STORAGE_KEYS = {
  activeTab: 'kid-game:active-tab',
  carScore: 'kid-game:car-score',
  hindiScore: 'kid-game:hindi-score',
  labScore: 'kid-game:lab-score',
  ladderScore: 'kid-game:ladder-score',
  mathScore: 'kid-game:math-score',
} as const

export const readStoredValue = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as unknown
    if (
      fallback &&
      parsed &&
      typeof fallback === 'object' &&
      typeof parsed === 'object' &&
      !Array.isArray(fallback) &&
      !Array.isArray(parsed)
    ) {
      return { ...fallback, ...parsed } as T
    }
    return parsed as T
  } catch {
    return fallback
  }
}

export const writeStoredValue = <T,>(key: string, value: T) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export const clearStoredValues = () => {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}
