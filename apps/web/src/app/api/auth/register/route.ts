import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '输入不合法: ' + parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // 检查邮箱是否已注册
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 });
    }

    // 创建用户
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: {
        email,
        name,
        password: passwordHash,
      },
    });

    // 创建默认 Workspace
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-workspace`;
    await db.workspace.create({
      data: {
        name: `${name} 的团队`,
        slug,
        plan: 'FREE',
        members: {
          create: {
            userId: user.id,
            role: 'ADMIN',
          },
        },
      },
    });

    return NextResponse.json({ success: true, message: '注册成功' });
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json({ error: '注册失败，请重试' }, { status: 500 });
  }
}
