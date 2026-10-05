"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import CreateCustomerView from "@/components/dashboard/CreateCustomerView";
import CustomerManagementView from "@/components/dashboard/CustomerManagementView";
import { fetchCustomerList } from "@/lib/customer/api";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface CustomerRoutesProps {
  /** The `/…/create-customer` path this container is mounted under. */
  path: string;
  /** Leave the module entirely (back to the dashboard overview). */
  onExit: () => void;
}

/**
 * Routes the Customer area of the dashboard shell:
 *
 *   <path>            -> the create form when the user has no customers yet,
 *                        otherwise the Customer Management list
 *   <path>/new        -> the create form
 *   <path>/<name>/edit-> the edit form for one owned customer
 *
 * Sub-routes are real URLs (address bar changes, Back works) — the shell only
 * mounts this container; the decision is made here from the pathname.
 */
export default function CustomerRoutes({ path, onExit }: CustomerRoutesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useLanguage();

  const suffix = pathname.startsWith(path) ? pathname.slice(path.length) : "";
  const isNew = suffix === "/new";
  const editMatch = suffix.match(/^\/(.+)\/edit$/);
  const editName = editMatch ? decodeURIComponent(editMatch[1]) : "";

  const goToList = () => router.push(path);
  const goNew = () => router.push(`${path}/new`);
  const goEdit = (name: string) => router.push(`${path}/${encodeURIComponent(name)}/edit`);

  // Base-path decision only: 0 customers -> the create form; otherwise the list.
  // Latched once so creating the first customer does not swap the success card
  // out from under the user.
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (isNew || editName) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const data = await fetchCustomerList(language);
        if (active) setCount(data.customers?.length ?? 0);
      } catch {
        if (active) setCount(-1); // probe failed -> let the list show its own state
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isNew, editName, language]);

  if (isNew) return <CreateCustomerView onBack={goToList} />;
  if (editName) return <CreateCustomerView editName={editName} onBack={goToList} />;

  if (count === null) {
    return (
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-4" aria-busy="true">
        <div className="h-[132px] animate-pulse rounded-[24px] border border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]" />
      </div>
    );
  }

  if (count === 0) return <CreateCustomerView onBack={onExit} />;

  return <CustomerManagementView onBack={onExit} onNew={goNew} onEdit={goEdit} />;
}
