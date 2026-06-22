'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfigEditor } from './ConfigEditor';
import { Settings2, Plus, Search, Pencil, Trash2, Loader2, RefreshCw } from 'lucide-react';
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

const envTabs = [
  { value: 'DEV', label: 'DEV' },
  { value: 'TEST', label: 'TEST' },
  { value: 'PROD', label: 'PROD' },
] as const;

export function ConfigList() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [env, setEnv] = useState<'DEV' | 'TEST' | 'PROD' | 'ALL'>('DEV');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<Config | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">配置中心</h1>
          <p className="text-sm text-[#6B7280] mt-1">管理所有环境配置项</p>
        </div>
        <Button onClick={handleCreate}>
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
              'px-4 py-1.5 rounded-md text-xs font-medium transition-colors',
              env === tab.value ? 'bg-[#4F46E5] text-white' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
            )}
          >
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
        <Button variant="outline" size="icon" onClick={handleSearch}>
          <Search className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={fetchConfigs}>
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
              <Settings2 className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
              <p className="text-sm text-[#6B7280]">暂无配置项</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={handleCreate}>
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
                    <th className="text-left py-3 px-2 text-xs font-medium text-[#6B7280]">描述</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-[#6B7280]">更新时间</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-[#6B7280]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((config) => (
                    <tr key={config.id} className="border-b border-[#F3F4F6] hover:bg-[#F8F9FB]">
                      <td className="py-3 px-2 font-mono text-sm font-medium text-[#1F2937]">{config.key}</td>
                      <td className="py-3 px-2 font-mono text-sm text-[#6B7280] max-w-[200px] truncate">
                        {config.value}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={typeColors[config.type]}>{config.type}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="gray">{config.environment}</Badge>
                      </td>
                      <td className="py-3 px-2 text-sm text-[#6B7280] max-w-[150px] truncate">
                        {config.description || '-'}
                      </td>
                      <td className="py-3 px-2 text-xs text-[#9CA3AF] whitespace-nowrap">
                        {timeAgo(config.updatedAt)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(config)}
                            className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#4F46E5] transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(config.id)}
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
        key={editConfig?.id || 'new'}
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
