import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RoleDocRoleView from "@/components/role-routes/RoleDocRoleView";
import { ROLE_ACCESS_GUIDES } from "@/lib/role-routes";

type RoleParams = { role: string };

export function generateStaticParams(): RoleParams[] {
  return ROLE_ACCESS_GUIDES.map((guide) => ({ role: guide.key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RoleParams>;
}): Promise<Metadata> {
  const { role } = await params;
  const guide = ROLE_ACCESS_GUIDES.find((entry) => entry.key === role);

  if (!guide) return {};

  return {
    title: `${guide.title.en} — ${guide.dashboardRoute} | Shikkha Chat Connected OS`,
    description: guide.who.en,
  };
}

export default async function RoleDocRolePage({
  params,
}: {
  params: Promise<RoleParams>;
}) {
  const { role } = await params;
  const guide = ROLE_ACCESS_GUIDES.find((entry) => entry.key === role);

  if (!guide) notFound();

  return <RoleDocRoleView roleKey={guide.key} />;
}
