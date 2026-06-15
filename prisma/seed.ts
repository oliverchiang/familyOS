import { PrismaClient } from "@prisma/client";
import { tasksToAward } from "../src/lib/economy";
import { weekStartISO } from "../src/lib/week";

// Seeds the single family + this week's task definitions and progress.
// Idempotent: clears existing data first. Reward minutes / homework goals are
// placeholders pending Oliver's confirmation (see docs/PRD.md open questions).

const prisma = new PrismaClient();

const weekStart = weekStartISO(new Date());

async function createKidTasks(kidId: string, instrument: { title: string; icon: string }) {
  const instr = await prisma.task.create({
    data: {
      kidId,
      title: instrument.title,
      icon: instrument.icon,
      tile: "drums",
      display: "TALLY",
      targetCount: 4,
      rewardMins: 40,
      order: 0,
    },
  });
  const chinese = await prisma.task.create({
    data: {
      kidId,
      title: "Chinese homework",
      icon: "book",
      tile: "book",
      display: "BAR",
      targetCount: 5,
      rewardMins: 30,
      order: 1,
    },
  });
  const maths = await prisma.task.create({
    data: {
      kidId,
      title: "Maths homework",
      icon: "pencil",
      tile: "maths",
      display: "BAR",
      targetCount: 4,
      rewardMins: 30,
      order: 2,
    },
  });
  return { instr, chinese, maths };
}

async function logProgress(kidId: string, taskId: string, times: number) {
  if (times <= 0) return;
  await prisma.completion.createMany({
    data: Array.from({ length: times }, () => ({
      taskId,
      kidId,
      weekStart,
      approved: true,
    })),
  });
}

/** Create EARN entries for any met-but-unawarded targets (mirrors syncAwards). */
async function awardKid(kidId: string) {
  const tasks = await prisma.task.findMany({ where: { kidId, active: true } });
  const counts = await prisma.completion.groupBy({
    by: ["taskId"],
    where: { kidId, weekStart, approved: true },
    _count: { _all: true },
  });
  const countByTask = new Map(counts.map((c) => [c.taskId, c._count._all]));

  const toAward = tasksToAward(
    tasks.map((t) => ({
      taskId: t.id,
      approvedCount: countByTask.get(t.id) ?? 0,
      target: t.targetCount,
      rewardMins: t.rewardMins,
    })),
    new Set(),
  );

  if (toAward.length > 0) {
    await prisma.ledgerEntry.createMany({
      data: toAward.map((t) => ({
        kidId,
        weekStart,
        type: "EARN" as const,
        minutes: t.rewardMins,
        taskId: t.taskId,
        note: "Weekly target met",
      })),
    });
  }
}

async function main() {
  // Clear in dependency order.
  await prisma.ledgerEntry.deleteMany();
  await prisma.completion.deleteMany();
  await prisma.task.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.setting.deleteMany();

  await prisma.familyMember.create({
    data: { name: "Mum", role: "PARENT", avatar: "💜", order: 0 },
  });
  const tyler = await prisma.familyMember.create({
    data: { name: "Tyler", role: "KID", avatar: "🥁", order: 1, weeklyCapMins: 120 },
  });
  const riley = await prisma.familyMember.create({
    data: { name: "Riley", role: "KID", avatar: "🎸", order: 2, weeklyCapMins: 120 },
  });

  // Tyler — matches the design mockup state.
  const tylerTasks = await createKidTasks(tyler.id, { title: "Drums", icon: "drums" });
  await logProgress(tyler.id, tylerTasks.instr.id, 2);
  await logProgress(tyler.id, tylerTasks.chinese.id, 3);
  await logProgress(tyler.id, tylerTasks.maths.id, 4);
  await awardKid(tyler.id);

  // Riley — a different, lighter progress state.
  const rileyTasks = await createKidTasks(riley.id, { title: "Guitar", icon: "guitar" });
  await logProgress(riley.id, rileyTasks.instr.id, 4);
  await logProgress(riley.id, rileyTasks.chinese.id, 1);
  await awardKid(riley.id);

  console.log(`Seeded family for week starting ${weekStart}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
