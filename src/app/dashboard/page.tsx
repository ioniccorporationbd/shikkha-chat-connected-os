import type { Metadata } from "next";
import RoleDocHubView from "@/components/role-routes/RoleDocHubView";

export const metadata: Metadata = {
  title: "Role-based dashboards — every route | Shikkha Chat Connected OS",
  description:
    "Every dashboard route of all eight Shikkha Chat Apps roles (Admin, Student, Teacher, Parent, Content Reviewer, AI Safety Reviewer, NGO Admin, Government Officer), documented under the same route names.",
};

export default function RoleDocHubPage() {
  return <RoleDocHubView />;
}
