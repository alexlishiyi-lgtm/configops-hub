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

interface SidebarProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
  role: string;
}

const navItems = [
  { href: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { href: '/configs', label: '配置中心', icon: Settings2 },
  { href: '/packages', label: '包仓库', icon: Package },
  { href: '/changelog', label: '变更日志', icon: GitCommitHorizontal },
  { href: '/settings', label: '设置', icon: Settings },
];

const planLabels: Record<string, string> = {
  FREE: '免费版',
  PRO: '专业版',
  TEAM: '团队版',
};

const planColors: Record<string, string> = {
  FREE: 'bg-[#F3F4F6] text-[#6B7280]',
  PRO: 'bg-[#EEF2FF] text-[#4F46E5]',
  TEAM: 'bg-[#FFFBEB] text-[#F59E0B]',
};

export function Sidebar({ workspace, role }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] h-screen bg-white border-r border-[#E5E7EB] flex flex-col fixed left-0 top-0 z-30">
      {/* Logo + Workspace */}
      <div className="h-16 flex items-center gap-2 px-6 border-b border-[#E5E7EB]">
        <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-bold text-sm shrink-0">
          C
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[#1F2937] text-sm truncate">ConfigOps Hub</p>
          <p className="text-xs text-[#9CA3AF] truncate">{workspace.name}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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

      {/* Footer — Plan info */}
      <div className="p-4 border-t border-[#E5E7EB]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F8F9FB]">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', planColors[workspace.plan] || planLabels.FREE)}>
            <Boxes className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#1F2937] truncate">
              {planLabels[workspace.plan] || '免费版'}
            </p>
            <p className="text-xs text-[#9CA3AF]">
              {role === 'ADMIN' ? '管理员' : role === 'DEVELOPER' ? '开发者' : '只读'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
