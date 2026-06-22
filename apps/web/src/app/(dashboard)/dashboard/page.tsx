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
} from 'lucide-react';

const stats = [
  { label: '配置项', value: '6', icon: Settings2, color: 'text-[#4F46E5]', bg: 'bg-[#EEF2FF]' },
  { label: '今日变更', value: '3', icon: GitCommitHorizontal, color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]' },
  { label: '包数量', value: '3', icon: Package, color: 'text-[#F59E0B]', bg: 'bg-[#FFFBEB]' },
  { label: '团队成员', value: '1', icon: Users, color: 'text-[#3B82F6]', bg: 'bg-[#EFF6FF]' },
];

const recentChanges = [
  { action: '修改', resource: 'database.host', env: 'PROD', user: '演示用户', time: '2 分钟前', type: 'UPDATE' },
  { action: '新增', resource: 'app.debug', env: 'DEV', user: '演示用户', time: '1 小时前', type: 'CREATE' },
  { action: '推送', resource: 'redis.url', env: 'TEST', user: '演示用户', time: '3 小时前', type: 'PUSH' },
  { action: '修改', resource: 'app.port', env: 'DEV', user: '演示用户', time: '昨天', type: 'UPDATE' },
];

const quickActions = [
  { href: '/configs', label: '新建配置', icon: Settings2, desc: '添加新的配置项' },
  { href: '/packages', label: '上传包', icon: Package, desc: '发布私有 npm/pip 包' },
  { href: '/changelog', label: '查看日志', icon: GitCommitHorizontal, desc: '追踪所有变更' },
  { href: '/settings', label: '邀请成员', icon: Users, desc: '添加团队成员' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">欢迎回来 👋</h1>
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
              {recentChanges.map((change, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2 border-b border-[#F3F4F6] last:border-0"
                >
                  <Badge
                    variant={
                      change.type === 'CREATE' ? 'success' :
                      change.type === 'UPDATE' ? 'warning' :
                      change.type === 'PUSH' ? 'info' : 'gray'
                    }
                  >
                    {change.action}
                  </Badge>
                  <span className="font-medium text-sm text-[#1F2937] flex-1">
                    {change.resource}
                  </span>
                  <Badge variant="gray">{change.env}</Badge>
                  <span className="text-xs text-[#9CA3AF] w-20 text-right">{change.time}</span>
                </div>
              ))}
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
