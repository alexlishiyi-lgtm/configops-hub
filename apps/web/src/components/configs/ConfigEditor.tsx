'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Loader2, History, RotateCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';

interface ConfigEditorProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  config?: {
    id: string;
    key: string;
    value: string;
    type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    environment: 'DEV' | 'TEST' | 'PROD';
    description?: string | null;
  } | null;
  defaultEnv?: 'DEV' | 'TEST' | 'PROD';
}

interface Snapshot {
  id: string;
  version: number;
  value: string;
  changedBy: string;
  changeType: 'CREATED' | 'UPDATED' | 'DELETED' | 'PUSHED';
  createdAt: string;
}

const typeOptions = [
  { value: 'STRING', label: 'String' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'BOOLEAN', label: 'Boolean' },
  { value: 'JSON', label: 'JSON' },
] as const;

const envOptions = [
  { value: 'DEV', label: 'DEV', color: 'gray' as const },
  { value: 'TEST', label: 'TEST', color: 'info' as const },
  { value: 'PROD', label: 'PROD', color: 'warning' as const },
] as const;

const changeTypeLabels: Record<string, { label: string; color: 'default' | 'info' | 'success' | 'warning' | 'gray' }> = {
  CREATED: { label: '创建', color: 'success' },
  UPDATED: { label: '更新', color: 'info' },
  DELETED: { label: '删除', color: 'warning' },
  PUSHED: { label: '推送', color: 'default' },
};

export function ConfigEditor({ open, onClose, onSaved, config, defaultEnv = 'DEV' }: ConfigEditorProps) {
  const isEdit = !!config;
  const [key, setKey] = useState(config?.key ?? '');
  const [value, setValue] = useState(config?.value ?? '');
  const [type, setType] = useState<'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON'>(config?.type ?? 'STRING');
  const [environment, setEnvironment] = useState<'DEV' | 'TEST' | 'PROD'>(config?.environment ?? defaultEnv);
  const [description, setDescription] = useState(config?.description ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Version history state
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rollbackVersion, setRollbackVersion] = useState<number | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [expandedSnapshot, setExpandedSnapshot] = useState<number | null>(null);

  // Fetch snapshots when editing
  const fetchSnapshots = useCallback(async () => {
    if (!config) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/configs/${config.id}`);
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data.config?.snapshots || []);
      }
    } catch {
      // silent
    } finally {
      setHistoryLoading(false);
    }
  }, [config]);

  useEffect(() => {
    if (open && isEdit) {
      fetchSnapshots();
    }
  }, [open, isEdit, fetchSnapshots]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isEdit ? `/api/configs/${config!.id}` : '/api/configs';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit
        ? { value, description: description || null }
        : { key, value, type, environment, description: description || null };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '操作失败');
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (targetVersion: number) => {
    setRollbackLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/configs/${config!.id}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVersion }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '回滚失败');
        return;
      }

      // Update local value to the rolled-back value
      setValue(data.rollback.newValue);
      setRollbackVersion(null);
      // Refresh snapshots
      fetchSnapshots();
      onSaved();
    } catch {
      setError('网络错误，请重试');
    } finally {
      setRollbackLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] shrink-0">
          <h2 className="text-lg font-semibold text-[#1F2937]">
            {isEdit ? '编辑配置' : '新建配置'}
          </h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1F2937]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Key */}
            <div className="space-y-1.5">
              <Label>配置键名 (Key)</Label>
              {isEdit ? (
                <div className="px-3 py-2 rounded-lg bg-[#F8F9FB] border border-[#E5E7EB] font-mono text-sm text-[#6B7280]">
                  {key}
                </div>
              ) : (
                <>
                  <Input
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="如 database.host"
                    className="font-mono"
                    required
                  />
                  <p className="text-xs text-[#9CA3AF]">只能包含字母、数字、点、下划线、短横线</p>
                </>
              )}
            </div>

            {/* Type */}
            {!isEdit && (
              <div className="space-y-1.5">
                <Label>类型</Label>
                <div className="flex gap-2">
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setType(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        type === opt.value
                          ? 'bg-[#4F46E5] text-white'
                          : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Environment */}
            {!isEdit && (
              <div className="space-y-1.5">
                <Label>环境 <span className="text-[#EF4444]">*</span></Label>
                <div className="flex gap-2">
                  {envOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEnvironment(opt.value)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        environment === opt.value
                          ? 'bg-[#4F46E5] text-white'
                          : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        environment === opt.value ? 'bg-white/80' :
                        opt.value === 'DEV' ? 'bg-[#6B7280]' :
                        opt.value === 'TEST' ? 'bg-[#2563EB]' : 'bg-[#D97706]'
                      }`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#9CA3AF]">
                  当前将在 <span className="font-semibold text-[#4F46E5]">{environment}</span> 环境下创建此配置项
                </p>
              </div>
            )}

            {/* Value */}
            <div className="space-y-1.5">
              <Label>值 (Value)</Label>
              {type === 'JSON' ? (
                <textarea
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder='{"key": "value"}'
                  className="w-full min-h-[100px] rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 font-mono text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                  required
                />
              ) : type === 'BOOLEAN' ? (
                <div className="flex gap-2">
                  {['true', 'false'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setValue(v)}
                      className={`px-4 py-2 rounded-lg text-sm font-mono font-medium transition-colors ${
                        value === v
                          ? 'bg-[#4F46E5] text-white'
                          : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              ) : (
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === 'NUMBER' ? '如 5432' : '如 localhost'}
                  className="font-mono"
                  required
                />
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>描述 (可选)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="如 数据库连接地址"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="px-3 py-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#EF4444]">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEdit ? '保存修改' : '创建配置'}
              </Button>
            </div>
          </form>

          {/* Version History (edit mode only) */}
          {isEdit && (
            <div className="border-t border-[#E5E7EB]">
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="flex items-center justify-between w-full px-6 py-3 text-sm font-medium text-[#1F2937] hover:bg-[#F8F9FB] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#6B7280]" />
                  版本历史 ({snapshots.length})
                </span>
                {historyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {historyOpen && (
                <div className="px-6 pb-5 space-y-2">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 text-[#9CA3AF] animate-spin" />
                    </div>
                  ) : snapshots.length === 0 ? (
                    <p className="text-sm text-[#9CA3AF] text-center py-4">暂无历史记录</p>
                  ) : (
                    <>
                      {snapshots.map((snap, idx) => {
                        const isLatest = idx === 0;
                        const isExpanded = expandedSnapshot === snap.version;
                        const isRollbackTarget = rollbackVersion === snap.version;
                        const isCurrentValue = snap.value === value && isLatest;

                        return (
                          <div
                            key={snap.id}
                            className={cn(
                              'rounded-lg border transition-colors',
                              isRollbackTarget
                                ? 'border-[#EF4444] bg-[#FEF2F2]'
                                : isLatest
                                ? 'border-[#4F46E5]/30 bg-[#EEF2FF]/30'
                                : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
                            )}
                          >
                            <div className="flex items-center gap-3 px-3 py-2.5">
                              {/* Version badge */}
                              <div className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                                isLatest ? 'bg-[#4F46E5] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'
                              )}>
                                v{snap.version}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Badge variant={changeTypeLabels[snap.changeType]?.color || 'gray'}>
                                    {changeTypeLabels[snap.changeType]?.label || snap.changeType}
                                  </Badge>
                                  {isLatest && (
                                    <span className="text-xs font-medium text-[#4F46E5]">当前版本</span>
                                  )}
                                  <span className="text-xs text-[#9CA3AF]">{timeAgo(snap.createdAt)}</span>
                                </div>
                                <p className="text-xs font-mono text-[#6B7280] mt-0.5 truncate">
                                  {snap.value}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => setExpandedSnapshot(isExpanded ? null : snap.version)}
                                  className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] transition-colors text-xs"
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                                {!isLatest && (
                                  <button
                                    onClick={() => setRollbackVersion(snap.version)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#4F46E5] transition-colors"
                                  >
                                    <RotateCw className="w-3 h-3" />
                                    回滚
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Expanded value */}
                            {isExpanded && (
                              <div className="px-3 pb-3">
                                <div className="px-3 py-2 rounded-lg bg-[#F8F9FB] border border-[#F3F4F6] font-mono text-xs text-[#1F2937] whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                                  {snap.value}
                                </div>
                              </div>
                            )}

                            {/* Rollback confirmation */}
                            {isRollbackTarget && (
                              <div className="px-3 pb-3 space-y-2">
                                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA]">
                                  <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                                  <p className="text-xs text-[#EF4444]">
                                    确定要回滚到 v{snap.version} 吗？当前值将被替换，但历史记录会保留（生成新版本）。
                                  </p>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setRollbackVersion(null)}
                                    disabled={rollbackLoading}
                                  >
                                    取消
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleRollback(snap.version)}
                                    disabled={rollbackLoading}
                                  >
                                    {rollbackLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                                    确认回滚
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Diff hint */}
                      {snapshots.length > 1 && (
                        <p className="text-xs text-[#9CA3AF] text-center pt-2">
                          共 {snapshots.length} 个版本，点击 <ChevronDown className="w-3 h-3 inline" /> 查看版本值，点击「回滚」恢复历史版本
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
