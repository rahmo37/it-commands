export const runtime = "nodejs";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function unauthorized(req: Request) {
  return req.headers.get("x-admin-key") !== process.env.ADMIN_KEY;
}

// Next.js passes params as a Promise — await it before use
type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  if (unauthorized(req))
    return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await ctx.params; // ✅ await params
  const bigintId = BigInt(id);

  const body = await req.json();
  const { title, commandText, platform, tags, notes } = body ?? {};

  const updated = await prisma.command.update({
    where: { id: bigintId },
    data: {
      ...(title !== undefined ? { title: String(title) } : {}),
      ...(commandText !== undefined
        ? { commandText: String(commandText) }
        : {}),
      ...(platform !== undefined ? { platform: String(platform) as any } : {}),
      ...(tags !== undefined
        ? {
            tags: Array.isArray(tags)
              ? tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean)
              : [],
          }
        : {}),
      ...(notes !== undefined ? { notes: notes ? String(notes) : null } : {}),
    },
  });

  return NextResponse.json({ id: updated.id.toString() });
}

export async function DELETE(req: Request, ctx: Ctx) {
  if (unauthorized(req))
    return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await ctx.params; // ✅ await params
  const bigintId = BigInt(id);

  await prisma.command.delete({ where: { id: bigintId } });
  return new NextResponse(null, { status: 204 });
}
