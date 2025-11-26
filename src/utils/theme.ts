import { Theme } from '../components/GameState'

// ============================================================
// MANUAL OVERRIDE - Set to a Theme value to force that theme
// Set to null to use UTC calendar-based theme
// ============================================================
const THEME_OVERRIDE: Theme | null = null
// Examples:
// const THEME_OVERRIDE: Theme | null = Theme.CHRISTMAS  // Force Christmas
// const THEME_OVERRIDE: Theme | null = Theme.SUMMER     // Force Summer
// const THEME_OVERRIDE: Theme | null = null             // Use calendar
// ============================================================

/**
 * Get the current theme based on UTC calendar or manual override
 * All players see the same theme since it's UTC-based
 */
export function getCurrentTheme(): Theme {
  // Manual override takes priority
  if (THEME_OVERRIDE !== null) {
    console.log(`Theme override active: ${THEME_OVERRIDE}`)
    return THEME_OVERRIDE
  }

  // UTC-based calendar theme
  return getCalendarTheme()
}

/**
 * Determine theme based on current UTC date
 *
 * Calendar Rules:
 * - Christmas: Dec 15 - Dec 26
 * - New Year: Dec 27 - Jan 7
 * - Summer: Jun 1 - Aug 31
 * - Autumn: Sep 1 - Nov 14
 * - Default: All other dates
 */
function getCalendarTheme(): Theme {
  const now = new Date()
  const month = now.getUTCMonth() + 1 // 1-12
  const day = now.getUTCDate()

  // Christmas: Dec 15-26
  if (month === 12 && day >= 15 && day <= 26) {
    return Theme.CHRISTMAS
  }

  // New Year: Dec 27-31 OR Jan 1-7
  if ((month === 12 && day >= 27) || (month === 1 && day <= 7)) {
    return Theme.NEW_YEAR
  }

  // Summer: Jun, Jul, Aug
  if (month >= 6 && month <= 8) {
    return Theme.SUMMER
  }

  // Autumn: Sep, Oct, Nov 1-14
  if (month >= 9 && month <= 10) {
    return Theme.AUTUMN
  }
  if (month === 11 && day <= 14) {
    return Theme.AUTUMN
  }

  // Default for all other dates
  return Theme.DEFAULT
}

/**
 * Get theme name for logging/debug
 */
export function getThemeDisplayName(theme: Theme): string {
  switch (theme) {
    case Theme.CHRISTMAS:
      return '🎄 Christmas'
    case Theme.NEW_YEAR:
      return '🎆 New Year'
    case Theme.SUMMER:
      return '☀️ Summer'
    case Theme.AUTUMN:
      return '🍂 Autumn'
    default:
      return '🌿 Default'
  }
}
