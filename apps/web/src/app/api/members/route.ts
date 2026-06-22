import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getWorkspace } from '@/lib/workspace';
import { checkMemberLimit, PLAN_LIMITS } from '@/lib/plan-limits';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'DEVELOPER', 'VIEWER']).default('DEVELOPER'),
});

/**
 * GET /api/members
 * List all members of the current workspace.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ctx = await getWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  const members = await db.member.findMany({
    where: { workspaceId: ctx.workspace.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ members, currentUserId: session.user.id });
}

/**
 * POST /api/members
 * Invite a member to the workspace by email.
 * If the user doesn't exist yet, they'll be added when they register.
 * For now, we only support adding existing users.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ctx = await getWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  // Only ADMIN can invite members
  if (ctx.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can invite members' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = inviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, role } = parsed.data;

  // Check plan limits
  const limitCheck = await checkMemberLimit(ctx.workspace.id, ctx.workspace.plan, db);
  if (!limitCheck.allowed) {
    return NextResponse.json({
      error: `已达到 ${PLAN_LIMITS[ctx.workspace.plan].label} 成员上限 (${limitCheck.max} 人)，请升级计划`,
    }, { status: 402 });
  }

  // Find user by email
  const targetUser = await db.user.findUnique({
    where: { email },
  });

  if (!targetUser) {
    return NextResponse.json(
      { error: '用户尚未注册，请先让对方注册账号' },
      { status: 404 }
    );
  }

  // Check if already a member
  const existing = await db.member.findUnique({
    where: {
      userId_workspaceId: {
        userId: targetUser.id,
        workspaceId: ctx.workspace.id,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: '该用户已是团队成员' },
      { status: 409 }
    );
  }

  const member = await db.$transaction(async (tx) => {
    const member = await tx.member.create({
      data: {
        userId: targetUser.id,
        workspaceId: ctx.workspace.id,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        workspaceId: ctx.workspace.id,
        userId: session.user.id,
        action: 'MEMBER_INVITE',
        resource: 'member',
        resourceId: member.id,
        detail: { email, role, invitedUser: targetUser.email },
      },
    });

    return member;
  });

  return NextResponse.json({ member }, { status: 201 });
}

/**
 * PATCH /api/members
 * Update a member's role.
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ctx = await getWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  if (ctx.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can change roles' }, { status: 403 });
  }

  const body = await request.json();
  const { memberId, role } = body as { memberId: string; role: 'ADMIN' | 'DEVELOPER' | 'VIEWER' };

  if (!memberId || !['ADMIN', 'DEVELOPER', 'VIEWER'].includes(role)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const member = await db.member.findFirst({
    where: { id: memberId, workspaceId: ctx.workspace.id },
  });

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  const updated = await db.member.update({
    where: { id: memberId },
    data: { role },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  return NextResponse.json({ member: updated });
}

/**
 * DELETE /api/members?memberId=xxx
 * Remove a member from the workspace.
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ctx = await getWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
  }

  if (ctx.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('memberId');

  if (!memberId) {
    return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
  }

  const member = await db.member.findFirst({
    where: { id: memberId, workspaceId: ctx.workspace.id },
  });

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  // Prevent removing yourself if you're the only admin
  if (member.userId === session.user.id && member.role === 'ADMIN') {
    const adminCount = await db.member.count({
      where: { workspaceId: ctx.workspace.id, role: 'ADMIN' },
    });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: '不能移除最后一个管理员' },
        { status: 400 }
      );
    }
  }

  await db.$transaction(async (tx) => {
    await tx.member.delete({ where: { id: memberId } });

    await tx.auditLog.create({
      data: {
        workspaceId: ctx.workspace.id,
        userId: session.user.id,
        action: 'MEMBER_REMOVE',
        resource: 'member',
        resourceId: memberId,
        detail: { removedUserId: member.userId },
      },
    });
  });

  return NextResponse.json({ success: true });
}
