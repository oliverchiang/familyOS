import { PrismaClient } from "@prisma/client";
import { tasksToAward } from "../src/lib/economy";
import { weekStartISO } from "../src/lib/week";

// Seeds the single family + this week's and last week's state.
// Idempotent: clears existing data first. Reward/target values come from the
// design handoff (placeholders pending Oliver — PRD §10). PIN = 1234.

const prisma = new PrismaClient();

const now = new Date();
const current = weekStartISO(now);
const last = addDaysISO(current, -7);

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

function dayInWeek(weekStart: string, offset: number): Date {
  const [y, m, d] = weekStart.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + offset, 12));
}

async function createKidTasks(kidId: string, instrument: { title: string; kind: string }) {
  const instr = await prisma.task.create({
    data: { kidId, title: instrument.title, kind: instrument.kind, display: "TALLY", targetCount: 4, rewardMins: 60, order: 0 },
  });
  const chinese = await prisma.task.create({
    data: { kidId, title: "Chinese homework", kind: "book", display: "BAR", targetCount: 5, rewardMins: 30, order: 1 },
  });
  const maths = await prisma.task.create({
    data: { kidId, title: "Maths homework", kind: "pencil", display: "BAR", targetCount: 5, rewardMins: 30, order: 2 },
  });
  return { instr, chinese, maths };
}

async function logs(
  kidId: string,
  taskId: string,
  weekStart: string,
  count: number,
  status: "APPROVED" | "PENDING",
  createdAt: Date,
) {
  if (count <= 0) return;
  await prisma.completion.createMany({
    data: Array.from({ length: count }, () => ({ kidId, taskId, weekStart, status, createdAt })),
  });
}

/** Create celebrated EARN entries for any met targets that week (seed-only). */
async function awardWeek(kidId: string, weekStart: string, createdAt?: Date) {
  const tasks = await prisma.task.findMany({ where: { kidId, active: true } });
  const counts = await prisma.completion.groupBy({
    by: ["taskId"],
    where: { kidId, weekStart, status: "APPROVED" },
    _count: { _all: true },
  });
  const cmap = new Map(counts.map((c) => [c.taskId, c._count._all]));
  const toAward = tasksToAward(
    tasks.map((t) => ({ taskId: t.id, approvedCount: cmap.get(t.id) ?? 0, target: t.targetCount, rewardMins: t.rewardMins })),
    new Set(),
  );
  if (toAward.length > 0) {
    await prisma.ledgerEntry.createMany({
      data: toAward.map((t) => ({ kidId, weekStart, type: "EARN" as const, minutes: t.rewardMins, taskId: t.taskId, note: "Weekly target met", celebrated: true, ...(createdAt ? { createdAt } : {}) })),
      skipDuplicates: true,
    });
  }
}

async function main() {
  await prisma.ledgerEntry.deleteMany();
  await prisma.completion.deleteMany();
  await prisma.task.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.setting.deleteMany();

  await prisma.setting.createMany({
    data: [
      { key: "parentPin", value: "1234" },
      { key: "timezone", value: "Europe/London" },
    ],
  });

  await prisma.familyMember.create({
    data: { name: "Mum", role: "PARENT", avatarKey: "mum", order: 0 },
  });
  const tyler = await prisma.familyMember.create({
    data: { name: "Tyler", role: "KID", avatarKey: "tyler", order: 1 },
  });
  const riley = await prisma.familyMember.create({
    data: { name: "Riley", role: "KID", avatarKey: "riley", order: 2 },
  });

  const tylerTasks = await createKidTasks(tyler.id, { title: "Drums", kind: "drum" });
  const rileyTasks = await createKidTasks(riley.id, { title: "Guitar", kind: "guitar" });

  // ---- Last week: both kids finished everything ----
  const lastDay = dayInWeek(last, 2);
  for (const [kid, tasks] of [[tyler, tylerTasks], [riley, rileyTasks]] as const) {
    await logs(kid.id, tasks.instr.id, last, 4, "APPROVED", lastDay);
    await logs(kid.id, tasks.chinese.id, last, 5, "APPROVED", lastDay);
    await logs(kid.id, tasks.maths.id, last, 5, "APPROVED", lastDay);
    await awardWeek(kid.id, last, lastDay);
  }

  // ---- This week (matches the design state) ----
  const today = now;
  // Tyler: drums 3 approved + 1 pending, chinese 3, maths 5 (earned)
  await logs(tyler.id, tylerTasks.instr.id, current, 3, "APPROVED", today);
  await logs(tyler.id, tylerTasks.instr.id, current, 1, "PENDING", today);
  await logs(tyler.id, tylerTasks.chinese.id, current, 3, "APPROVED", today);
  await logs(tyler.id, tylerTasks.maths.id, current, 5, "APPROVED", today);
  await awardWeek(tyler.id, current);
  // Tyler has used 15 mins of screen time
  await prisma.ledgerEntry.create({
    data: { kidId: tyler.id, weekStart: current, type: "REDEEM", minutes: -15, note: "Used screen time" },
  });

  // Riley: guitar 1 approved + 1 pending, chinese 5 (earned), maths 1
  await logs(riley.id, rileyTasks.instr.id, current, 1, "APPROVED", today);
  await logs(riley.id, rileyTasks.instr.id, current, 1, "PENDING", today);
  await logs(riley.id, rileyTasks.chinese.id, current, 5, "APPROVED", today);
  await logs(riley.id, rileyTasks.maths.id, current, 1, "APPROVED", today);
  await awardWeek(riley.id, current);

  console.log(`Seeded family. Current week ${current}, last week ${last}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
