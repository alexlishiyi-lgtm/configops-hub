'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Settings2,
  Package,
  GitCommitHorizontal,
  Users,
  ArrowRight,
  Activity,
  Loader2,
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface StatsData {
  stats: {
    configCount: number;
    todayChanges: number;
    packageCount: number;
    memberCount: number;
  };
  recentChanges: Array<{
    id: string;
    action: string;
    resource: string;
    key: string;
    environment: string | null;
    user: string;
    createdAt: string;
  }>;
}

const actionLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' | 'gray' | 'default' }> = {
  CREATE: { label: '新增', variant: 'success' },
  UPDATE: { label: '修改', variant: 'warning' },
  DELETE: { label: '删除', variant: 'danger' },
  PUSH: { label: '推送', variant: 'info' },
  ROLLBACK: { label: '回滚', variant: 'default' },
  MEMBER_INVITE: { label: '邀请', variant: 'gray' },
  MEMBER_REMOVE: { label: '移除', variant: 'gray' },
  LOGIN: { label: '登录', variant: 'gray' },
  LOGOUT: { label: '登出', variant: 'gray' },
};

const quickActions = [
  { href: '/configs', label: '新建配置', icon: Settings2, desc: '添加新的配置项' },
  { href: '/packages', label: '上传包', icon: Package, desc: '发布私有 npm/pip 包' },
  { href: '/changelog', label: '查看日志', icon: GitCommitHorizontal, desc: '追踪所有变更' },
  { href: '/settings', label: '邀请成员', icon: Users, desc: '添加团队成员' },
];

export default function DashboardPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => setData(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#9CA3AF] animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: '配置项', value: data.stats.configCount, icon: Settings2, color: 'text-[#4F46E5]', bg: 'bg-[#EEF2FF]' },
    { label: '今日变更', value: data.stats.todayChanges, icon: GitCommitHorizontal, color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]' },
    { label: '包数量', value: data.stats.packageCount, icon: Package, color: 'text-[#F59E0B]', bg: 'bg-[#FFFBEB]' },
    { label: '团队成员', value: data.stats.memberCount, icon: Users, color: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF]' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">欢迎回来</h1>
        <p className="text-white/80">这是你的配置管理中心概览</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#1F2937]">{stat.value}</p>
              <p className="text-sm text-[#6B7280]">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent changes */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1F2937] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#4F46E5]" />
                最近变更
              </h2>
              <Link href="/changelog">
                <Button variant="ghost" size="sm">
                  查看全部 <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {data.recentChanges.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] text-center py-8">暂无变更记录</p>
              ) : (
                data.recentChanges.map((change) => {
                  const actionInfo = actionLabels[change.action] || { label: change.action, variant: 'gray' as const };
                  return (
                    <div
                      key={change.id}
                      className="flex items-center gap-3 py-2 border-b border-[#F3F4F6] last:border-0"
                    >
                      <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>
                      <span className="font-medium text-sm text-[#1F2937] flex-1 truncate">
                        {change.key}
                      </span>
                      {change.environment && <Badge variant="gray">{change.environment}</Badge>}
                      <span className="text-xs text-[#9CA3AF] w-24 text-right truncate">{change.user}</span>
                      <span className="text-xs text-[#9CA3AF] w-20 text-right whitespace-nowrap">
                        {timeAgo(change.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-[#1F2937] mb-4">快捷操作</h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] hover:border-[#4F46E5] hover:bg-[#F8F9FB] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                    <action.icon className="w-4 h-4 text-[#4F46E5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1F2937]">{action.label}</p>
                    <p className="text-xs text-[#9CA3AF]">{action.desc}</p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-[#D1D5DB] group-hover:text-[#4F46E5]" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
