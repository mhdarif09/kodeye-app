const SKILL_CATEGORIES = [
  'SYSTEM_DESIGN',
  'TECHNICAL_COMMUNICATION',
  'DEBUGGING',
  'NEGOTIATION',
  'STAKEHOLDER_MANAGEMENT',
  'MENTORING',
  'INTERVIEW_PREP',
];

const EXPERIENCE_LEVELS = ['junior', 'mid', 'senior'];

/** Session-count badge thresholds. Each entry: { id, label, minSessions } */
const BADGE_THRESHOLDS = [
  { id: 'newcomer',   label: 'Newcomer',    minSessions: 1   },
  { id: 'apprentice', label: 'Apprentice',  minSessions: 10  },
  { id: 'practitioner', label: 'Practitioner', minSessions: 50 },
  { id: 'master',     label: 'Master',      minSessions: 100 },
];

/** Default ELO rating for a brand-new player in any skill category */
const DEFAULT_ELO = 1200;

/** ELO K-factor — controls how fast ratings shift per match */
const ELO_K_FACTOR = 32;

module.exports = {
  SKILL_CATEGORIES,
  EXPERIENCE_LEVELS,
  BADGE_THRESHOLDS,
  DEFAULT_ELO,
  ELO_K_FACTOR,
};
