import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const role = req.nextUrl.searchParams.get("role");

    const members = await prisma.familyMember.findMany({
      where: role ? { role } : {},
      orderBy: { name: "asc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("GET /api/members error:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, role, avatar } = body;

    if (!name || !role) {
      return NextResponse.json({ error: "name and role are required" }, { status: 400 });
    }

    const member = await prisma.familyMember.create({
      data: { name, role, avatar: avatar || "👤" },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("POST /api/members error:", error);
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
}
