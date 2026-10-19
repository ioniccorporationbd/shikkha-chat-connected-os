"use client";

import { FiPlusCircle } from "react-icons/fi";

import CreateTicketForm from "@/components/help-desk/CreateTicketForm";
import TicketDetails from "@/components/help-desk/TicketDetails";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { helpDeskLinks } from "@/lib/help-desk/paths";

import HelpDeskBackButton from "./HelpDeskBackButton";
import HelpDeskMessages from "./HelpDeskMessages";
import HelpDeskOverview from "./HelpDeskOverview";
import HelpDeskSolvedTickets from "./HelpDeskSolvedTickets";
import HelpDeskTicketThread from "./HelpDeskTicketThread";
import HelpDeskTickets from "./HelpDeskTickets";

export type HelpDeskView =
  | "overview"
  | "new"
  | "tickets"
  | "solved"
  | "detail"
  | "messages"
  | "conversation"
  | "problems"
  | "problem";

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
  staff = false,
}: {
  view: HelpDeskView;
  basePath: string;
  ticketId?: string;
  copy: HelpDeskCopy;
  language: string;
  contact?: HelpDeskContactPrefill;
  /** True on the employee dashboard, which adds the problem queue. */
  staff?: boolean;
}) {
  const links = helpDeskLinks(basePath);

  if (view === "new") {
    // No breadcrumb trail on the create screen (deliberate): the form is a
    // focused, single-task surface — the heading says where you are and the
    // rail already shows the section.
    return (
      <div className="flex flex-col gap-5">
        <HelpDeskBackButton label={copy.back} fallbackHref={links.root} />
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[var(--color-primary)]">
            <FiPlusCircle className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-[19px] font-semibold text-[var(--color-primary)] sm:text-[21px]">{copy.createTitle}</h1>
            <p className="mt-0.5 max-w-2xl text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
              {copy.createSubtitle}
            </p>
          </div>
        </div>
        <CreateTicketForm copy={copy} language={language} basePath={basePath} initialContact={contact} />
      </div>
    );
  }

  if (view === "detail" && ticketId) {
    return (
      <div className="flex flex-col gap-4">
        <TicketDetails ticketId={ticketId} copy={copy} language={language} basePath={basePath} markSeen />
      </div>
    );
  }

  if (view === "tickets") {
    return <HelpDeskTickets copy={copy} language={language} basePath={basePath} />;
  }

  if (view === "solved") {
    return <HelpDeskSolvedTickets copy={copy} language={language} basePath={basePath} />;
  }

  if (view === "messages") {
    return <HelpDeskMessages language={language} basePath={basePath} />;
  }

  if (view === "problems") {
    return <HelpDeskMessages language={language} basePath={basePath} variant="problems" />;
  }

  if (view === "conversation" && ticketId) {
    return (
      <HelpDeskTicketThread
        language={language}
        ticketId={ticketId}
        listHref={links.messages}
        backFallback={links.messages}
      />
    );
  }

  if (view === "problem" && ticketId) {
    return (
      <HelpDeskTicketThread
        language={language}
        ticketId={ticketId}
        listHref={links.problems}
        backFallback={links.problems}
      />
    );
  }

  return <HelpDeskOverview copy={copy} language={language} basePath={basePath} staff={staff} />;
}
