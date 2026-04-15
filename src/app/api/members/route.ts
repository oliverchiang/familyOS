import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role");

  const members = await prisma.familyMember.findMany({
    where: role ? { role } : {},
    orderBy: { name: "asc" },
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, role, avatar } = body;

  const member = await prisma.familyMember.create({
    data: { name, role, avatar: avatar || "👤" },
  });

  return NextResponse.json(member);
}
