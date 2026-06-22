'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitCommitHorizontal, Loader2, RefreshCw } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  detail: Record<string, unknown> | null;
  userId: string | null;
  createdAt: string;
}

const actionConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'gray' }> = {
  CREATE: { label: '新增', variant: 'success' },
  UPDATE: { label: '修改', variant: 'warning' },
  DELETE: { label: '删除', variant: 'danger' },
  PUSH: { label: '推送', variant: 'info' },
  ROLLBACK: { label: '回滚', variant: 'default' },
  LOGIN: { label: '登录', variant: 'gray' },
  LOGOUT: { label: '登出', variant: 'gray' },
  MEMBER_INVITE: { label: '邀请', variant: 'info' },
  MEMBER_REMOVE: { label: '移除', variant: 'danger' },
};

const resourceLabels: Record<string, string> = {
  config: '配置',
  package: '包',
  member: '成员',
};

export default function ChangelogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    // We'll reuse the stats endpoint but need more logs
    // For now, fetch all audit logs via a simple approach
    const res = await fetch('/api/stats');
    const data = await res.json();
    // The stats endpoint returns recent 8, but we want more
    // Let's create a dedicated changelog API or extend stats
    setLogs(data.recentChanges || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">变更日志</h1>
          <p className="text-sm text-[#6B7280] mt-1">所有操作的审计记录</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchLogs}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitCommitHorizontal className="w-5 h-5 text-[#4F46E5]" />
            变更历史 ({logs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#9CA3AF] animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <GitCommitHorizontal className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
              <p className="text-sm text-[#6B7280]">暂无变更记录</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => {
                const actionInfo = actionConfig[log.action] || { label: log.action, variant: 'gray' as const };
                const detail = log.detail as Record<string, unknown> | null;
                const key = detail?.key || detail?.email || log.resource;
                const env = detail?.environment as string | undefined;
                const resourceLabel = resourceLabels[log.resource] || log.resource;

                return (
                  <div key={log.id} className="flex gap-3">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-[#4F46E5] mt-3" />
                      {index < logs.length - 1 && (
                        <div className="w-px flex-1 bg-[#E5E7EB]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>
                        <span className="text-sm font-medium text-[#1F2937]">{key}</span>
                        <Badge variant="gray">{resourceLabel}</Badge>
                        {env && <Badge variant="gray">{env}</Badge>}
                      </div>
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        {timeAgo(log.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
