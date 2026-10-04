"use client";

import CreateTicketForm from "@/components/help-desk/CreateTicketForm";
import TicketDetails from "@/components/help-desk/TicketDetails";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { helpDeskLinks } from "@/lib/help-desk/paths";

import HelpDeskBreadcrumb from "./HelpDeskBreadcrumb";
import HelpDeskOverview from "./HelpDeskOverview";
import HelpDeskTickets from "./HelpDeskTickets";

export type HelpDeskView = "overview" | "new" | "tickets" | "detail";

export interface HelpDeskContactPrefill {
  name?: string;
  email?: string;
  mobile?: string;
}

/**
 * The single, shared Help Desk module rendered inside the dashboard shell for
 * BOTH panels — the staff and customer dashboards mount the same component with
 * a different `basePath`. The shell already provides the sidebar, topbar,
 * profile menu, language switch and content area, so this renders only the
 * help-desk body (no separate page shell).
 */
export default function HelpDeskDashboard({
  view,
  basePath,
  ticketId,
  copy,
  language,
  contact,
}: {
  view: HelpDeskView;
  basePath: string;
  ticketId?: string;
  copy: HelpDeskCopy;
  language: string;
  contact?: HelpDeskContactPrefill;
}) {
  const links = helpDeskLinks(basePath);

  if (view === "new") {
    return (
      <div className="flex flex-col gap-4">
        <HelpDeskBreadcrumb copy={copy} basePath={basePath} crumbs={[{ label: copy.navNewTicket }]} />
        <div>
          <h1 className="text-[19px] font-semibold text-[var(--color-primary)] sm:text-[21px]">{copy.createTitle}</h1>
          <p className="mt-0.5 max-w-2xl text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
            {copy.createSubtitle}
          </p>
        </div>
        <CreateTicketForm copy={copy} language={language} basePath={basePath} initialContact={contact} />
      </div>
    );
  }

  if (view === "detail" && ticketId) {
    return (
      <div className="flex flex-col gap-4">
        <HelpDeskBreadcrumb
          copy={copy}
          basePath={basePath}
          crumbs={[{ label: copy.listTitle, href: links.tickets }, { label: ticketId }]}
        />
        <TicketDetails ticketId={ticketId} copy={copy} language={language} basePath={basePath} markSeen />
      </div>
    );
  }

  if (view === "tickets") {
    return <HelpDeskTickets copy={copy} language={language} basePath={basePath} />;
  }

  return <HelpDeskOverview copy={copy} language={language} basePath={basePath} />;
}
