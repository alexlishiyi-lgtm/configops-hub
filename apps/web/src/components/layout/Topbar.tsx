'use client';

import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const routeNames: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/configs': '配置中心',
  '/packages': '包仓库',
  '/changelog': '变更日志',
  '/settings': '设置',
};

export function Topbar({ user }: { user: { name?: string | null; email?: string | null; image?: string | null } }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentRoute = Object.entries(routeNames).find(
    ([route]) => pathname === route || pathname.startsWith(route + '/')
  );
  const breadcrumb = currentRoute ? currentRoute[1] : '仪表盘';
  const initials = user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 fixed top-0 left-[220px] right-0 z-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[#9CA3AF]">ConfigOps Hub</span>
        <span className="text-[#D1D5DB]">/</span>
        <span className="font-medium text-[#1F2937]">{breadcrumb}</span>
      </div>

      {/* User Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#F8F9FB] transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-sm font-medium">
            {initials}
          </div>
          <span className="text-sm font-medium text-[#1F2937] hidden sm:block">
            {user.name || user.email}
          </span>
          <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-[#E5E7EB] shadow-lg py-1 animate-fade-in">
            <div className="px-3 py-2 border-b border-[#F3F4F6]">
              <p className="text-sm font-medium text-[#1F2937] truncate">{user.name}</p>
              <p className="text-xs text-[#9CA3AF] truncate">{user.email}</p>
            </div>
            <a
              href="/settings"
              className="flex items-center gap-2 px-3 py-2 text-sm text-[#6B7280] hover:bg-[#F8F9FB] hover:text-[#1F2937]"
            >
              <Settings className="w-4 h-4" />
              设置
            </a>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#EF4444] hover:bg-[#FEF2F2]"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
