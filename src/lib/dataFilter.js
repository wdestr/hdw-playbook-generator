/**
 * Filter sessions for a specific persona based on tags
 * Prioritizes keynotes first, then tag-matched sessions
 * @param {Array} sessions - Array of session objects
 * @param {Array} personaTags - Array of tags the persona is interested in
 * @param {number} limit - Maximum number of sessions to return (default: 30)
 * @returns {Array} Filtered and ordered sessions
 */
export function filterSessionsForPersona(sessions, personaTags, limit = 30) {
  if (!sessions || !Array.isArray(sessions)) return [];
  if (!personaTags || !Array.isArray(personaTags) || personaTags.length === 0) return [];

  // Separate keynotes from other sessions
  const keynotes = sessions.filter(session => session.tags && session.tags.includes('keynote'));
  const nonKeynotes = sessions.filter(session => !session.tags || !session.tags.includes('keynote'));

  // Filter non-keynote sessions by tag match
  const tagMatchedSessions = nonKeynotes.filter(session =>
    session.tags && session.tags.some(tag => personaTags.includes(tag))
  );

  // Combine: keynotes first, then tag-matched sessions
  const combined = [...keynotes, ...tagMatchedSessions];

  // Return up to limit items
  return combined.slice(0, limit);
}

/**
 * Filter exhibitors for a specific persona based on category match
 * @param {Array} exhibitors - Array of exhibitor objects
 * @param {Array} personaTags - Array of tags/categories the persona is interested in
 * @param {number} limit - Maximum number of exhibitors to return (default: 50)
 * @returns {Array} Filtered exhibitors
 */
export function filterExhibitorsForPersona(exhibitors, personaTags, limit = 50) {
  if (!exhibitors || !Array.isArray(exhibitors)) return [];
  if (!personaTags || !Array.isArray(personaTags)) return [];

  // Filter exhibitors by category match
  const filtered = exhibitors.filter(exhibitor =>
    exhibitor.categories && exhibitor.categories.some(category => personaTags.includes(category))
  );

  // Return up to limit items
  return filtered.slice(0, limit);
}
