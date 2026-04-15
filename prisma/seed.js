const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.rewardClaim.deleteMany();
  await prisma.video.deleteMany();
  await prisma.task.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.familyMember.deleteMany();

  const parent = await prisma.familyMember.create({
    data: { name: "Mum", role: "PARENT", avatar: "👩" },
  });

  const kid1 = await prisma.familyMember.create({
    data: { name: "Alex", role: "KID", avatar: "🧒" },
  });

  const kid2 = await prisma.familyMember.create({
    data: { name: "Sam", role: "KID", avatar: "👧" },
  });

  await prisma.reward.createMany({
    data: [
      { title: "30 min TV time", emoji: "📺", pointsCost: 30 },
      { title: "Ice cream", emoji: "🍦", pointsCost: 20 },
      { title: "Extra screen time", emoji: "🎮", pointsCost: 40 },
      { title: "Stay up 30 min late", emoji: "🌙", pointsCost: 50 },
      { title: "Pick dinner", emoji: "🍕", pointsCost: 25 },
    ],
  });

  const today = new Date().toISOString().split("T")[0];

  await prisma.task.createMany({
    data: [
      { kidId: kid1.id, title: "Practice drums", emoji: "🥁", durationMins: 15, date: today, order: 0, points: 15 },
      { kidId: kid1.id, title: "Read a book", emoji: "📚", durationMins: 20, date: today, order: 1, points: 20 },
      { kidId: kid1.id, title: "Tidy bedroom", emoji: "🛏️", durationMins: 10, date: today, order: 2, points: 10 },
      { kidId: kid2.id, title: "Piano practice", emoji: "🎹", durationMins: 20, date: today, order: 0, points: 20 },
      { kidId: kid2.id, title: "Homework", emoji: "✏️", durationMins: 30, date: today, order: 1, points: 30 },
    ],
  });

  console.log("Seeded: parent", parent.name, "| kids:", kid1.name, kid2.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
