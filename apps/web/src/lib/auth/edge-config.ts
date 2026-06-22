import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe auth config — 只包含不依赖 Node.js 原生模块的配置
 * 用于 middleware (Edge Runtime)
 */
export const edgeAuthConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [], // 在完整配置中添加
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // 公开路由
      const isPublicRoute =
        pathname === '/' ||
        pathname === '/login' ||
        pathname === '/register' ||
        pathname.startsWith('/api/auth');

      // 已登录用户访问登录/注册页 → 跳转到 dashboard
      if ((pathname === '/login' || pathname === '/register') && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      // 未登录用户访问受保护路由 → 拒绝（自动跳转到 signIn page）
      if (!isPublicRoute && !isLoggedIn) {
        return false;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
