import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitCommitHorizontal, RotateCcw } from 'lucide-react';

const changes = [
  { action: '修改', resource: 'database.host', env: 'PROD', user: '演示用户', time: '2026-06-22 17:45', type: 'UPDATE', version: 3, old: '192.168.1.100', new: 'db.prod.internal' },
  { action: '新增', resource: 'app.debug', env: 'DEV', user: '演示用户', time: '2026-06-22 16:30', type: 'CREATE', version: 1, old: null, new: 'true' },
  { action: '推送', resource: 'redis.url', env: 'TEST', user: '演示用户', time: '2026-06-22 14:00', type: 'PUSH', version: 2, old: 'redis://old:6379', new: 'redis://localhost:6379' },
  { action: '修改', resource: 'app.port', env: 'DEV', user: '演示用户', time: '2026-06-21 18:00', type: 'UPDATE', version: 2, old: '8080', new: '3000' },
  { action: '删除', resource: 'old.config', env: 'DEV', user: '演示用户', time: '2026-06-21 10:00', type: 'DELETE', version: 1, old: 'deprecated', new: null },
];

const typeColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'danger',
  PUSH: 'info',
};

export default function ChangelogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937]">变更日志</h1>
        <p className="text-sm text-[#6B7280] mt-1">追踪所有配置变更历史，支持一键回滚</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h2 className="font-semibold text-[#1F2937] flex items-center gap-2 mb-4">
              <GitCommitHorizontal className="w-4 h-4 text-[#4F46E5]" />
              变更时间线
            </h2>
            <div className="space-y-4">
              {changes.map((change, i) => (
                <div key={i} className="flex gap-4 pb-4 border-b border-[#F3F4F6] last:border-0 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      change.type === 'CREATE' ? 'bg-[#10B981]' :
                      change.type === 'UPDATE' ? 'bg-[#F59E0B]' :
                      change.type === 'DELETE' ? 'bg-[#EF4444]' :
                      'bg-[#3B82F6]'
                    }`} />
                    {i < changes.length - 1 && <div className="w-px h-full bg-[#E5E7EB] mt-1" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={typeColors[change.type]}>{change.action}</Badge>
                      <span className="font-mono text-sm font-medium text-[#1F2937]">{change.resource}</span>
                      <Badge variant="gray">{change.env}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
                      <span>v{change.version}</span>
                      <span>{change.user}</span>
                      <span>{change.time}</span>
                    </div>
                    {change.old !== null && change.new !== null && (
                      <div className="mt-2 rounded-lg bg-[#F8F9FB] border border-[#E5E7EB] p-2 font-mono text-xs">
                        <div className="text-[#EF4444]">- {change.old}</div>
                        <div className="text-[#10B981]">+ {change.new}</div>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="self-start">
                    <RotateCcw className="w-3 h-3" />
                    回滚
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Diff viewer placeholder */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-[#1F2937] mb-4">版本对比</h2>
            <p className="text-sm text-[#9CA3AF] text-center py-8">
              选择一条变更记录查看详细 Diff
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
