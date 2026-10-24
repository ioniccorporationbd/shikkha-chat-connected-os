import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RoleDocItemView from "@/components/role-routes/RoleDocItemView";
import { findRoleRoute, roleRouteSegments } from "@/lib/role-route-docs";
import { ROLE_ACCESS_GUIDES } from "@/lib/role-routes";

type RouteParams = { role: string; slug: string[] };

function fullPathFor({ role, slug }: RouteParams): string {
  return roleRouteSegments(`/dashboard/${role}/${slug.join("/")}`).reduce(
    (path, segment) => `${path}/${segment}`,
    "",
  );
}

export function generateStaticParams(): RouteParams[] {
  return ROLE_ACCESS_GUIDES.flatMap((guide) =>
    guide.menuGroups.flatMap((group) =>
      group.items.map((item) => ({
        role: guide.key,
        slug: roleRouteSegments(item.path).slice(2),
      })),
    ),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const resolved = await params;
  const match = findRoleRoute(fullPathFor(resolved));

  if (!match) return {};

  return {
    title: `${match.item.label.en} — ${match.item.path} | Shikkha Chat Connected OS`,
    description: match.item.description.en,
  };
}

export default async function RoleDocItemPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const resolved = await params;
  const routePath = fullPathFor(resolved);
  const match = findRoleRoute(routePath);

  if (!match) notFound();

  return <RoleDocItemView routePath={routePath} />;
}
