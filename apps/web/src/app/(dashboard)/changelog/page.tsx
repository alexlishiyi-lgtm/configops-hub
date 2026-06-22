'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitCommitHorizontal, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface ChangelogEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  detail: Record<string, unknown> | null;
  user: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

const actionFilters = [
  { value: '', label: '全部' },
  { value: 'CREATE', label: '新增' },
  { value: 'UPDATE', label: '修改' },
  { value: 'DELETE', label: '删除' },
  { value: 'MEMBER_INVITE', label: '成员' },
];

export default function ChangelogPage() {
  const [logs, setLogs] = useState<ChangelogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (actionFilter) params.set('action', actionFilter);

      const res = await fetch(`/api/changelog?${params}`);
      if (!res.ok) {
        setLogs([]);
        return;
      }
      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || null);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (value: string) => {
    setActionFilter(value);
    setPage(1);
  };

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

      {/* Filter */}
      <div className="flex items-center gap-2">
        {actionFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              actionFilter === f.value
                ? 'bg-[#4F46E5] text-white'
                : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitCommitHorizontal className="w-5 h-5 text-[#4F46E5]" />
            变更历史 {pagination && `(${pagination.total})`}
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
            <>
              <div className="space-y-1">
                {logs.map((log, index) => {
                  const actionInfo = actionConfig[log.action] || { label: log.action, variant: 'gray' as const };
                  const detail = log.detail;
                  const key = detail?.key || detail?.email || detail?.removedUserId || log.resource;
                  const env = (detail?.environment as string | undefined) || null;
                  const oldValue = detail?.oldValue as string | undefined;
                  const newValue = detail?.newValue as string | undefined;
                  const resourceLabel = resourceLabels[log.resource] || log.resource;

                  return (
                    <div key={log.id} className="flex gap-3">
                      {/* Timeline */}
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mt-3 ${
                          actionInfo.variant === 'danger' ? 'bg-[#EF4444]' :
                          actionInfo.variant === 'success' ? 'bg-[#10B981]' :
                          actionInfo.variant === 'warning' ? 'bg-[#F59E0B]' :
                          actionInfo.variant === 'info' ? 'bg-[#3B82F6]' :
                          'bg-[#9CA3AF]'
                        }`} />
                        {index < logs.length - 1 && (
                          <div className="w-px flex-1 bg-[#E5E7EB]" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-4 pt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>
                          <span className="text-sm font-medium text-[#1F2937] font-mono">{String(key)}</span>
                          <Badge variant="gray">{resourceLabel}</Badge>
                          {env && <Badge variant="gray">{env}</Badge>}
                        </div>
                        {(oldValue || newValue) && (
                          <div className="mt-1.5 flex items-center gap-2 text-xs font-mono">
                            {oldValue && (
                              <span className="text-[#EF4444] line-through opacity-70 max-w-[200px] truncate">
                                {oldValue}
                              </span>
                            )}
                            {oldValue && newValue && <span className="text-[#9CA3AF]">→</span>}
                            {newValue && (
                              <span className="text-[#10B981] max-w-[200px] truncate">
                                {newValue}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-[#9CA3AF] mt-1">
                          {log.user} · {timeAgo(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB] mt-4">
                  <p className="text-xs text-[#9CA3AF]">
                    第 {pagination.page} / {pagination.totalPages} 页，共 {pagination.total} 条
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      下一页
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
