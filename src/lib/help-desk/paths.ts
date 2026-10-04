/**
 * Help Desk — dashboard-aware route helpers.
 *
 * The ticket centre now renders INSIDE the dashboard shell, so its links are
 * relative to the dashboard help-desk root (`/userDashboard/help-desk` or
 * `/clientDashboard/help-desk`) instead of the retired public `/help-desk`
 * routes. Every component that links between help-desk screens takes a
 * `basePath` (the help-desk root) and derives its hrefs here, so there is a
 * single source of truth and the two dashboards can never drift.
 */

/** The route segment that hosts the ticket centre under each dashboard. */
export const HELP_DESK_SEGMENT = "help-desk";

export interface HelpDeskLinks {
  /** The overview root, e.g. `/userDashboard/help-desk`. */
  root: string;
  /** The New Ticket form. */
  newTicket: string;
  /** The ticket list. */
  tickets: string;
  /** A single ticket's details. */
  ticket: (id: string) => string;
}

/** Build the help-desk link set for a dashboard root (defaults to the public root). */
export function helpDeskLinks(base = `/${HELP_DESK_SEGMENT}`): HelpDeskLinks {
  const root = base.replace(/\/+$/, "");
  return {
    root,
    newTicket: `${root}/new`,
    tickets: `${root}/tickets`,
    ticket: (id: string) => `${root}/tickets/${encodeURIComponent(id)}`,
  };
}
