export const runtime = "nodejs";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
// Simple admin guard
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const platform = searchParams.get("platform")?.trim() ?? "";

  const items = await prisma.command.findMany({
    where: {
      AND: [
        platform ? { platform: platform as any } : {},
        query ? { commandText: { contains: query, mode: "insensitive" } } : {},
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const safe = items.map(({ id, ...rest }) => ({ id: id.toString(), ...rest }));
  return NextResponse.json(safe);
}

export async function POST(req: Request) {
  // Simple admin guard
  const adminKey = req.headers.get("x-admin-key");
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { title, commandText, platform, tags, notes } = body ?? {};

  if (!title || !commandText || !platform) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  const created = await prisma.command.create({
    data: {
      title: String(title),
      commandText: String(commandText),
      platform: String(platform) as any,
      tags: Array.isArray(tags)
        ? tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean)
        : [],
      notes: notes ? String(notes) : null,
    },
  });

  return NextResponse.json({ id: created.id.toString() }, { status: 201 });
}
