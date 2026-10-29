"use client";

import { FiPlusCircle } from "react-icons/fi";

import CreateTicketForm from "@/components/help-desk/CreateTicketForm";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { helpDeskLinks } from "@/lib/help-desk/paths";

import HelpDeskBackButton from "./HelpDeskBackButton";
import HelpDeskOverview from "./HelpDeskOverview";
import HelpDeskSolvedTickets from "./HelpDeskSolvedTickets";
import HelpDeskTicketThread from "./HelpDeskTicketThread";
import HelpDeskTickets from "./HelpDeskTickets";
import ProblemQueue from "./ProblemQueue";

export type HelpDeskView =
  | "overview"
  | "new"
  | "tickets"
  | "solved"
  | "detail"
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
        <HelpDeskBackButton label={copy.back} homeLabel={copy.helpDeskHome} fallbackHref={links.root} />
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

  if ((view === "detail" || view === "conversation") && ticketId) {
    // One shared screen for customers and staff: the problem block in its own
    // section, then the WhatsApp-style conversation in a completely separate
    // section. `conversation` is the same thread with a taller panel, so old
    // "see all messages" links keep working.
    return (
      <HelpDeskTicketThread
        // One ticket is one room: remounting clears the previous ticket's
        // messages, cursors, quote target and draft instead of resetting them
        // field by field after the fact.
        key={ticketId}
        language={language}
        ticketId={ticketId}
        listHref={links.tickets}
        backFallback={links.tickets}
        expanded={view === "conversation"}
        chatOnly={view === "conversation"}
        allConversationsHref={view === "detail" ? links.conversation(ticketId) : undefined}
      />
    );
  }

  if (view === "tickets") {
    return <HelpDeskTickets copy={copy} language={language} basePath={basePath} />;
  }

  if (view === "solved") {
    // The customer's "Solved" list is their own finished tickets; for an
    // employee the same route is the Solve Problem queue — the tickets they are
    // working on or have finished, with the detail card in place.
    return staff ? (
      <ProblemQueue language={language} mode="solve" />
    ) : (
      <HelpDeskSolvedTickets copy={copy} language={language} basePath={basePath} />
    );
  }

  if (view === "problems") {
    // New Problem: only tickets the ERP still reports as open. The queue opens
    // the detail card in place, so there is no separate problem page to visit.
    return <ProblemQueue language={language} mode="open" />;
  }

  if (view === "problem" && ticketId) {
    return (
      <HelpDeskTicketThread
        key={ticketId}
        language={language}
        ticketId={ticketId}
        listHref={links.problems}
        backFallback={links.problems}
      />
    );
  }

  return <HelpDeskOverview copy={copy} language={language} basePath={basePath} staff={staff} />;
}
