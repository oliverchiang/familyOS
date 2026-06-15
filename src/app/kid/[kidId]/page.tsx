import { redirect } from "next/navigation";
import { KidDashboard } from "@/components/kid-dashboard";
import { getKidWeekView } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function KidPage({
  params,
  searchParams,
}: {
  params: Promise<{ kidId: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const { kidId } = await params;
  const { week } = await searchParams;
  const view = await getKidWeekView(kidId, week);
  if (!view) redirect("/");
  return <KidDashboard view={view} />;
}
