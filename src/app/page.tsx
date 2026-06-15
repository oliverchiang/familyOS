import { KidWeeklyView } from "@/components/kid-weekly-view";
import { tylerWeek } from "@/lib/mock-data";

export default function Home() {
  return <KidWeeklyView initialWeek={tylerWeek} />;
}
