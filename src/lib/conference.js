// Single source of truth for conference dates, derived from the conference
// metadata file. Import DAY1/DAY2 instead of hardcoding date strings.
import agendaMeta from '../../public/data/agenda-meta.json';

export const CONFERENCE_DATES = agendaMeta.dates;
export const [DAY1, DAY2] = agendaMeta.dates;
