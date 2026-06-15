import { redirect } from "next/navigation";
import { isParentUnlocked } from "@/app/actions";
import { ParentDashboard } from "@/components/parent-dashboard";
import { getParentDeskView } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function ParentPage() {
  if (!(await isParentUnlocked())) redirect("/");
  const view = await getParentDeskView();
  return <ParentDashboard view={view} />;
}
