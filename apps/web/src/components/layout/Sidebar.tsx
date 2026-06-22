'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Settings2,
  Package,
  GitCommitHorizontal,
  Settings,
  Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { href: '/configs', label: '配置中心', icon: Settings2 },
  { href: '/packages', label: '包仓库', icon: Package },
  { href: '/changelog', label: '变更日志', icon: GitCommitHorizontal },
  { href: '/settings', label: '设置', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] h-screen bg-white border-r border-[#E5E7EB] flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-6 border-b border-[#E5E7EB]">
        <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-bold text-sm">
          C
        </div>
        <span className="font-semibold text-[#1F2937]">ConfigOps Hub</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider px-3 mb-2">菜单</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#EEF2FF] text-[#4F46E5]'
                  : 'text-[#6B7280] hover:bg-[#F8F9FB] hover:text-[#1F2937]'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#E5E7EB]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F8F9FB]">
          <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-xs font-medium">
            <Boxes className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#1F2937] truncate">免费版</p>
            <p className="text-xs text-[#9CA3AF]">升级获取更多</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
