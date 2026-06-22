'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfigEditor } from './ConfigEditor';
import { Settings2, Plus, Search, Pencil, Trash2, Loader2, RefreshCw, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';

interface Config {
  id: string;
  key: string;
  value: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  environment: 'DEV' | 'TEST' | 'PROD';
  description?: string | null;
  updatedAt: string;
  _count?: { snapshots: number };
}

const typeColors: Record<string, 'default' | 'success' | 'warning' | 'info' | 'gray'> = {
  STRING: 'default',
  NUMBER: 'info',
  BOOLEAN: 'success',
  JSON: 'warning',
};

const envColors: Record<string, 'gray' | 'info' | 'warning'> = {
  DEV: 'gray',
  TEST: 'info',
  PROD: 'warning',
};

const envTabs = [
  { value: 'DEV', label: 'DEV', color: 'bg-[#6B7280]' },
  { value: 'TEST', label: 'TEST', color: 'bg-[#2563EB]' },
  { value: 'PROD', label: 'PROD', color: 'bg-[#D97706]' },
] as const;

export function ConfigList() {
  const searchParams = useSearchParams();
  const initialEnv = (searchParams.get('env') as 'DEV' | 'TEST' | 'PROD' | 'ALL' | null) || 'ALL';
  const initialSearch = searchParams.get('q') || '';

  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [env, setEnv] = useState<'DEV' | 'TEST' | 'PROD' | 'ALL'>(initialEnv);
  const [search, setSearch] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<Config | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (env !== 'ALL') params.set('env', env);
    if (search) params.set('q', search);
    const newUrl = params.toString() ? `/configs?${params.toString()}` : '/configs';
    const currentUrl = window.location.pathname + window.location.search;
    if (currentUrl !== newUrl) {
      window.history.replaceState({}, '', newUrl);
    }
  }, [env, search]);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (env !== 'ALL') params.set('env', env);
      if (search) params.set('search', search);

      const res = await fetch(`/api/configs?${params}`);
      if (!res.ok) {
        setConfigs([]);
        return;
      }
      const data = await res.json();
      setConfigs(data.configs || []);
    } catch {
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  }, [env, search]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const handleEdit = (config: Config) => {
    setEditConfig(config);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setEditConfig(null);
    setEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/configs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteId(null);
        fetchConfigs();
      }
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast here later
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">配置中心</h1>
          <p className="text-sm text-[#6B7280] mt-1">管理所有环境配置项</p>
        </div>
        <Button onClick={(e) => { e.stopPropagation(); handleCreate(); }}>
          <Plus className="w-4 h-4" />
          新建配置
        </Button>
      </div>

      {/* Environment tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setEnv('ALL')}
          className={cn(
            'px-4 py-1.5 rounded-md text-xs font-medium transition-colors',
            env === 'ALL' ? 'bg-[#4F46E5] text-white' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
          )}
        >
          全部
        </button>
        {envTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setEnv(tab.value)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-colors',
              env === tab.value ? 'bg-[#4F46E5] text-white' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', env === tab.value ? 'bg-white/80' : tab.color)} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <Input
            placeholder="搜索配置项..."
            className="pl-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button variant="outline" size="icon" type="button" onClick={handleSearch}>
          <Search className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" type="button" onClick={fetchConfigs}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Config table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="w-5 h-5 text-[#4F46E5]" />
            配置列表 ({configs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#9CA3AF] animate-spin" />
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#EEF2FF] flex items-center justify-center mx-auto mb-4">
                <Settings2 className="w-8 h-8 text-[#4F46E5]" />
              </div>
              <h3 className="text-base font-semibold text-[#1F2937] mb-2">还没有配置项</h3>
              <p className="text-sm text-[#6B7280] mb-1">配置项用于管理不同环境的参数，如数据库地址、API密钥等</p>
              <p className="text-xs text-[#9CA3AF] mb-6">支持 DEV / TEST / PROD 三个环境隔离</p>

              {/* 3-step guide */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F8F9FB]">
                  <div className="w-6 h-6 rounded-full bg-[#4F46E5] text-white text-xs flex items-center justify-center font-bold">1</div>
                  <span className="text-xs text-[#6B7280]">新建配置</span>
                </div>
                <div className="w-4 h-0.5 bg-[#E5E7EB]" />
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F8F9FB]">
                  <div className="w-6 h-6 rounded-full bg-[#4F46E5] text-white text-xs flex items-center justify-center font-bold">2</div>
                  <span className="text-xs text-[#6B7280]">SDK 拉取</span>
                </div>
                <div className="w-4 h-0.5 bg-[#E5E7EB]" />
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F8F9FB]">
                  <div className="w-6 h-6 rounded-full bg-[#4F46E5] text-white text-xs flex items-center justify-center font-bold">3</div>
                  <span className="text-xs text-[#6B7280]">上线</span>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={handleCreate}>
                <Plus className="w-3 h-3" /> 创建第一个配置
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="text-left py-3 px-2 text-xs font-medium text-[#6B7280]">Key</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-[#6B7280]">Value</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-[#6B7280]">类型</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-[#6B7280]">环境</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-[#6B7280]">更新时间</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-[#6B7280]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((config) => (
                    <tr key={config.id} className="border-b border-[#F3F4F6] hover:bg-[#F8F9FB] group">
                      <td className="py-3 px-2 font-mono text-sm font-medium text-[#1F2937]">{config.key}</td>
                      <td
                        className="py-3 px-2 font-mono text-sm text-[#6B7280] max-w-[500px] truncate"
                        title={config.value}
                      >
                        {config.value}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={typeColors[config.type]}>{config.type}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={envColors[config.environment] || 'gray'}>{config.environment}</Badge>
                      </td>
                      <td className="py-3 px-2 text-xs text-[#9CA3AF] whitespace-nowrap">
                        {timeAgo(config.updatedAt)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-end gap-1">
                          {/* Copy value — shown on row hover */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(config.value); }}
                            className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#4F46E5] transition-colors opacity-0 group-hover:opacity-100"
                            title="复制值"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {/* Copy key — shown on row hover */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(config.key); }}
                            className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#4F46E5] transition-colors opacity-0 group-hover:opacity-100"
                            title="复制 Key"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleEdit(config); }}
                            className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#4F46E5] transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDeleteId(config.id); }}
                            className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#EF4444] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor Modal */}
      <ConfigEditor
        key={editConfig?.id || `new-${env}`}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={fetchConfigs}
        config={editConfig}
        defaultEnv={env === 'ALL' ? 'DEV' : env}
      />

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-[#EF4444]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1F2937]">删除配置</h3>
            </div>
            <p className="text-sm text-[#6B7280] mb-5">
              确定要删除此配置项吗？系统会保留历史快照用于回滚，但当前配置将不再可用。
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
                取消
              </Button>
              <Button variant="danger" onClick={() => handleDelete(deleteId)} disabled={deleting}>
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
