import NextAuth from 'next-auth';
import { edgeAuthConfig } from '@/lib/auth/edge-config';

/**
 * Middleware 使用 Edge-safe 配置（不含 Prisma / bcrypt）
 * 只做路由保护，不做数据库查询
 */
export default NextAuth(edgeAuthConfig).auth;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
