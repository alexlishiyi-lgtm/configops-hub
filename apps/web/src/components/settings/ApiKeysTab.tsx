'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Plus, Trash2, Loader2, Copy, Check, AlertCircle } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/api-keys');
      if (!res.ok) { setKeys([]); return; }
      const data = await res.json();
      setKeys(data.keys || []);
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewKey(data.rawKey);
        setNewKeyName('');
        setShowCreate(false);
        fetchKeys();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('确定要吊销此密钥？吊销后使用此密钥的 SDK 将无法拉取配置。')) return;
    setRevoking(id);
    try {
      await fetch(`/api/api-keys?id=${id}`, { method: 'DELETE' });
      fetchKeys();
    } finally {
      setRevoking(null);
    }
  };

  const handleCopy = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* New key reveal */}
      {newKey && (
        <Card className="border-[#10B981] bg-[#ECFDF5]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-[#10B981]" />
              <h3 className="font-semibold text-[#1F2937]">密钥已创建 — 请立即保存</h3>
            </div>
            <p className="text-sm text-[#6B7280] mb-3">此密钥仅显示一次，关闭后将无法再次查看。</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-white border border-[#D1D5DB] font-mono text-sm text-[#1F2937] break-all">
                {newKey}
              </code>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setNewKey(null)}>
              我已保存，关闭
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[#4F46E5]" />
              API 密钥
            </span>
            <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
              <Plus className="w-4 h-4" />
              新建密钥
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showCreate && (
            <div className="flex gap-3 mb-4 pb-4 border-b border-[#E5E7EB]">
              <div className="flex-1">
                <Label>密钥名称</Label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="如 Production Server"
                />
              </div>
              <Button onClick={handleCreate} disabled={creating || !newKeyName} className="mt-7">
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                生成密钥
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-[#9CA3AF] animate-spin" />
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
              <p className="text-sm text-[#6B7280]">暂无 API 密钥</p>
              <p className="text-xs text-[#9CA3AF] mt-1">创建密钥后可在 SDK 中使用</p>
            </div>
          ) : (
            <div className="space-y-2">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] hover:bg-[#F8F9FB]"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                    <Key className="w-4 h-4 text-[#4F46E5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1F2937]">{key.name}</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-[#6B7280]">{key.keyPrefix}</code>
                      <span className="text-xs text-[#9CA3AF]">
                        · 创建于 {timeAgo(key.createdAt)}
                        {key.lastUsedAt && ` · 最近使用 ${timeAgo(key.lastUsedAt)}`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(key.id)}
                    disabled={revoking === key.id}
                    className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#EF4444] transition-colors disabled:opacity-50"
                  >
                    {revoking === key.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SDK Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SDK 接入示例</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-[#6B7280] mb-1.5">Node.js</p>
              <pre className="px-4 py-3 rounded-lg bg-[#1F2937] text-[#E5E7EB] text-xs font-mono overflow-x-auto">
{`npm install @configops/sdk

import { ConfigOps } from '@configops/sdk';

const config = new ConfigOps({
  apiKey: 'cop_your_api_key',
  env: 'PROD',
});

const configs = await config.fetch();
console.log(configs); // { "database.host": "localhost", ... }`}
              </pre>
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B7280] mb-1.5">Python</p>
              <pre className="px-4 py-3 rounded-lg bg-[#1F2937] text-[#E5E7EB] text-xs font-mono overflow-x-auto">
{`pip install configops-sdk

from configops import ConfigOps

config = ConfigOps(
    api_key='cop_your_api_key',
    env='PROD',
)

configs = config.fetch()
print(configs)  # { "database.host": "localhost", ... }`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
