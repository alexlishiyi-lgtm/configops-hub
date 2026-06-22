'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Plus, Upload, Search, Trash2, Loader2, RefreshCw, X, Download, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';

interface Pkg {
  id: string;
  name: string;
  scope: 'NPM' | 'PIP';
  version: string;
  description?: string | null;
  size: number;
  downloadCount: number;
  isPrivate: boolean;
  tarballUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

const scopeTabs = [
  { value: 'ALL', label: '全部' },
  { value: 'NPM', label: 'npm' },
  { value: 'PIP', label: 'pip' },
] as const;

function formatSize(bytes: number): string {
  if (bytes === 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'ALL' | 'NPM' | 'PIP'>('ALL');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);
  const [detailPkg, setDetailPkg] = useState<Pkg | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [origin, setOrigin] = useState('http://localhost:3002');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (scope !== 'ALL') params.set('scope', scope);
      if (search) params.set('search', search);

      const res = await fetch(`/api/packages?${params}`);
      if (!res.ok) {
        setPackages([]);
        return;
      }
      const data = await res.json();
      setPackages(data.packages || []);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [scope, search]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/packages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteId(null);
        setDetailPkg(null);
        fetchPackages();
      }
    } finally {
      setDeleting(false);
    }
  };

  const privateCount = packages.filter((p) => p.isPrivate).length;
  const proxyCount = packages.length - privateCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">包仓库</h1>
          <p className="text-sm text-[#6B7280] mt-1">私有包管理 + 公共包代理缓存</p>
        </div>
        <Button onClick={() => setPublishOpen(true)}>
          <Upload className="w-4 h-4" />
          发布包
        </Button>
      </div>

      {/* Scope tabs */}
      <div className="flex items-center gap-2">
        {scopeTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setScope(tab.value)}
            className={cn(
              'px-4 py-1.5 rounded-md text-xs font-medium transition-colors',
              scope === tab.value ? 'bg-[#4F46E5] text-white' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
            )}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 text-xs text-[#6B7280]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" />
            私有 {privateCount}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
            代理 {proxyCount}
          </span>
        </div>
      </div>

      {/* Registry setup banner */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <Package className="w-5 h-5 text-[#3B82F6]" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#1F2937]">npm Registry 已启用</p>
            <p className="text-xs text-[#6B7280] font-mono">{origin}/api/npm</p>
          </div>
          <Badge variant="info">运行中</Badge>
        </div>
        <div className="mt-3 pt-3 border-t border-[#BFDBFE] space-y-1.5">
          <p className="text-xs font-medium text-[#1F2937]">快速接入：</p>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-[#E5E7EB] font-mono text-xs text-[#6B7280]">
            <span className="text-[#9CA3AF]">$</span>
            <span className="flex-1">npm config set registry {origin}/api/npm</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-[#E5E7EB] font-mono text-xs text-[#6B7280]">
            <span className="text-[#9CA3AF]">$</span>
            <span className="flex-1">npm login --registry={origin}/api/npm</span>
            <span className="text-[#9CA3AF] text-[10px]">用 API Key 作为密码</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <Input
            placeholder="搜索包名..."
            className="pl-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button variant="outline" size="icon" onClick={handleSearch}>
          <Search className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={fetchPackages}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Package grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#9CA3AF] animate-spin" />
        </div>
      ) : packages.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
            <p className="text-sm text-[#6B7280] mb-1">暂无包</p>
            <p className="text-xs text-[#9CA3AF] mb-4">发布你的第一个私有包，或通过代理缓存公共包</p>
            <Button variant="outline" size="sm" onClick={() => setPublishOpen(true)}>
              <Plus className="w-3 h-3" /> 发布包
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setDetailPkg(pkg)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center',
                    pkg.scope === 'NPM' ? 'bg-[#FFFBEB]' : 'bg-[#EFF6FF]'
                  )}>
                    <Package className={cn(
                      'w-4 h-4',
                      pkg.scope === 'NPM' ? 'text-[#F59E0B]' : 'text-[#3B82F6]'
                    )} />
                  </div>
                  {pkg.isPrivate ? (
                    <Badge variant="warning">私有</Badge>
                  ) : (
                    <Badge variant="gray">代理</Badge>
                  )}
                </div>
                <h3 className="font-mono text-sm font-medium text-[#1F2937] mb-1">{pkg.name}</h3>
                <p className="text-xs text-[#6B7280] mb-3 line-clamp-1">{pkg.description || '无描述'}</p>
                <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                  <span>v{pkg.version}</span>
                  <span>{formatSize(pkg.size)}</span>
                  <span>{pkg.downloadCount} 次下载</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Publish Modal */}
      {publishOpen && (
        <PublishModal
          onClose={() => setPublishOpen(false)}
          onSaved={() => {
            setPublishOpen(false);
            fetchPackages();
          }}
        />
      )}

      {/* Detail Modal */}
      {detailPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailPkg(null)}>
          <div
            className="w-full max-w-lg rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  detailPkg.scope === 'NPM' ? 'bg-[#FFFBEB]' : 'bg-[#EFF6FF]'
                )}>
                  <Package className={cn(
                    'w-5 h-5',
                    detailPkg.scope === 'NPM' ? 'text-[#F59E0B]' : 'text-[#3B82F6]'
                  )} />
                </div>
                <div>
                  <h2 className="font-mono text-sm font-semibold text-[#1F2937]">{detailPkg.name}</h2>
                  <p className="text-xs text-[#9CA3AF]">v{detailPkg.version}</p>
                </div>
              </div>
              <button onClick={() => setDetailPkg(null)} className="text-[#9CA3AF] hover:text-[#1F2937]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Badges */}
              <div className="flex items-center gap-2">
                <Badge variant={detailPkg.scope === 'NPM' ? 'warning' : 'info'}>
                  {detailPkg.scope === 'NPM' ? 'npm' : 'pip'}
                </Badge>
                {detailPkg.isPrivate ? (
                  <Badge variant="warning">私有</Badge>
                ) : (
                  <Badge variant="gray">代理</Badge>
                )}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-[#9CA3AF]">版本</p>
                  <p className="text-sm font-mono font-medium text-[#1F2937]">{detailPkg.version}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#9CA3AF]">大小</p>
                  <p className="text-sm font-medium text-[#1F2937]">{formatSize(detailPkg.size)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#9CA3AF]">下载量</p>
                  <p className="text-sm font-medium text-[#1F2937]">{detailPkg.downloadCount} 次</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#9CA3AF]">更新时间</p>
                  <p className="text-sm font-medium text-[#1F2937]">{timeAgo(detailPkg.updatedAt)}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <p className="text-xs text-[#9CA3AF]">描述</p>
                <p className="text-sm text-[#1F2937]">{detailPkg.description || '无描述'}</p>
              </div>

              {/* Install command */}
              <div className="space-y-1">
                <p className="text-xs text-[#9CA3AF]">安装命令</p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F8F9FB] border border-[#E5E7EB] font-mono text-sm text-[#1F2937]">
                  {detailPkg.scope === 'NPM' ? (
                    <span className="flex-1 truncate">
                      <span className="text-[#6B7280]">$</span> npm install {detailPkg.name}
                    </span>
                  ) : (
                    <span className="flex-1 truncate">
                      <span className="text-[#6B7280]">$</span> pip install {detailPkg.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Tarball URL */}
              {detailPkg.tarballUrl && (
                <div className="space-y-1">
                  <p className="text-xs text-[#9CA3AF]">存储路径</p>
                  <p className="text-xs font-mono text-[#6B7280] break-all">{detailPkg.tarballUrl}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between px-6 py-4 border-t border-[#E5E7EB]">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteId(detailPkg.id)}
                  >
                <Trash2 className="w-4 h-4" />
                删除
              </Button>
              <Button variant="outline" onClick={() => setDetailPkg(null)}>
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-[#EF4444]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1F2937]">删除包</h3>
            </div>
            <p className="text-sm text-[#6B7280] mb-5">
              确定要删除此包吗？此操作不可撤销，已安装此包的项目将无法拉取更新。
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

// ==================== Publish Modal ====================

function PublishModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [scope, setScope] = useState<'NPM' | 'PIP'>('NPM');
  const [version, setVersion] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [size, setSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          scope,
          version,
          description: description || null,
          isPrivate,
          size: size ? parseInt(size, 10) : 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '发布失败');
        return;
      }

      onSaved();
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-lg font-semibold text-[#1F2937]">发布包</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1F2937]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Scope */}
          <div className="space-y-1.5">
            <Label>包管理器 <span className="text-[#EF4444]">*</span></Label>
            <div className="flex gap-2">
              {[
                { value: 'NPM' as const, label: 'npm', color: 'bg-[#F59E0B]' },
                { value: 'PIP' as const, label: 'pip', color: 'bg-[#3B82F6]' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setScope(opt.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    scope === opt.value
                      ? 'bg-[#4F46E5] text-white'
                      : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                  )}
                >
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    scope === opt.value ? 'bg-white/80' : opt.color
                  )} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label>包名 <span className="text-[#EF4444]">*</span></Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={scope === 'NPM' ? '如 @myorg/utils' : '如 my-utils'}
              className="font-mono"
              required
            />
            <p className="text-xs text-[#9CA3AF]">
              {scope === 'NPM' ? '支持 scoped 包名，如 @org/name' : 'Python 包名，如 my-package'}
            </p>
          </div>

          {/* Version */}
          <div className="space-y-1.5">
            <Label>版本 <span className="text-[#EF4444]">*</span></Label>
            <Input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="如 1.0.0"
              className="font-mono"
              required
            />
            <p className="text-xs text-[#9CA3AF]">语义化版本号，格式 x.y.z</p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>描述 (可选)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="如 通用工具函数库"
            />
          </div>

          {/* Size */}
          <div className="space-y-1.5">
            <Label>包大小 (字节，可选)</Label>
            <Input
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="如 24576"
              type="number"
            />
          </div>

          {/* Visibility */}
          <div className="space-y-1.5">
            <Label>可见性</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isPrivate ? 'bg-[#4F46E5] text-white' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', isPrivate ? 'bg-white/80' : 'bg-[#D97706]')} />
                私有
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  !isPrivate ? 'bg-[#4F46E5] text-white' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', !isPrivate ? 'bg-white/80' : 'bg-[#9CA3AF]')} />
                代理
              </button>
            </div>
            <p className="text-xs text-[#9CA3AF]">
              私有包仅工作区成员可访问，代理包从公共源缓存
            </p>
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
              <Upload className="w-4 h-4" />
              发布
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
