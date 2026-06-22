'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Webhook, Plus, Trash2, Loader2 } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastResponseCode: number | null;
  lastTriggeredAt: string | null;
  createdAt: string;
}

const availableEvents = [
  { value: 'config.created', label: '配置创建' },
  { value: 'config.updated', label: '配置修改' },
  { value: 'config.deleted', label: '配置删除' },
  { value: 'package.published', label: '包发布' },
  { value: 'member.invited', label: '成员邀请' },
  { value: 'member.removed', label: '成员移除' },
];

export function WebhooksTab() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['config.updated']);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/webhooks');
      if (!res.ok) { setWebhooks([]); return; }
      const data = await res.json();
      setWebhooks(data.webhooks || []);
    } catch {
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleCreate = async () => {
    setCreating(true);
    setPlanError(null);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, events: selectedEvents }),
      });
      if (res.ok) {
        setUrl('');
        setSelectedEvents(['config.updated']);
        setShowCreate(false);
        fetchWebhooks();
      } else if (res.status === 402) {
        const data = await res.json();
        setPlanError(data.error || '当前计划不支持 Webhook，请升级到专业版');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此 Webhook？')) return;
    setDeleting(id);
    try {
      await fetch(`/api/webhooks?id=${id}`, { method: 'DELETE' });
      fetchWebhooks();
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/webhooks?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchWebhooks();
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Webhook className="w-4 h-4 text-[#4F46E5]" />
              Webhook 通知
            </span>
            <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
              <Plus className="w-4 h-4" />
              新建 Webhook
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {planError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-sm text-[#92400E] flex items-center justify-between">
              <span>{planError}</span>
              <a href="/settings?tab=billing" className="text-xs font-medium text-[#4F46E5] hover:underline whitespace-nowrap">
                升级 →
              </a>
            </div>
          )}
          {showCreate && (
            <div className="space-y-4 mb-4 pb-4 border-b border-[#E5E7EB]">
              <div>
                <Label>回调地址 (URL)</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-app.com/api/webhook"
                />
              </div>
              <div>
                <Label>订阅事件</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableEvents.map((event) => (
                    <button
                      key={event.value}
                      type="button"
                      onClick={() => toggleEvent(event.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedEvents.includes(event.value)
                          ? 'bg-[#4F46E5] text-white'
                          : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                      }`}
                    >
                      {event.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} disabled={creating || !url || selectedEvents.length === 0}>
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                创建 Webhook
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-[#9CA3AF] animate-spin" />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-8">
              <Webhook className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
              <p className="text-sm text-[#6B7280]">暂无 Webhook</p>
              <p className="text-xs text-[#9CA3AF] mt-1">配置变更时可自动回调通知你的系统</p>
            </div>
          ) : (
            <div className="space-y-2">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="p-3 rounded-lg border border-[#E5E7EB] hover:bg-[#F8F9FB]"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2 h-2 rounded-full ${webhook.isActive ? 'bg-[#10B981]' : 'bg-[#D1D5DB]'}`} />
                    <code className="text-sm font-mono text-[#1F2937] flex-1 truncate">{webhook.url}</code>
                    <button
                      onClick={() => handleToggle(webhook.id, webhook.isActive)}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        webhook.isActive
                          ? 'bg-[#ECFDF5] text-[#10B981]'
                          : 'bg-[#F3F4F6] text-[#9CA3AF]'
                      }`}
                    >
                      {webhook.isActive ? '启用' : '已暂停'}
                    </button>
                    <button
                      onClick={() => handleDelete(webhook.id)}
                      disabled={deleting === webhook.id}
                      className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#EF4444] transition-colors disabled:opacity-50"
                    >
                      {deleting === webhook.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {webhook.events.map((event) => {
                      const label = availableEvents.find((e) => e.value === event)?.label || event;
                      return <Badge key={event} variant="gray">{label}</Badge>;
                    })}
                  </div>
                  {webhook.lastTriggeredAt && (
                    <p className="text-xs text-[#9CA3AF] mt-2">
                      最近触发 {timeAgo(webhook.lastTriggeredAt)}
                      {webhook.lastResponseCode !== null && (
                        <span className={`ml-2 ${webhook.lastResponseCode >= 200 && webhook.lastResponseCode < 300 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          · HTTP {webhook.lastResponseCode || 'Error'}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook docs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhook 签名验证</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#6B7280] mb-3">
            每个 Webhook 请求携带 <code className="px-1.5 py-0.5 rounded bg-[#F3F4F6] text-xs font-mono">X-ConfigOps-Signature</code> 头，
            使用 HMAC-SHA256 签名。验证签名以确保请求来自 ConfigOps Hub：
          </p>
          <pre className="px-4 py-3 rounded-lg bg-[#1F2937] text-[#E5E7EB] text-xs font-mono overflow-x-auto">
{`import crypto from 'crypto';

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return expected === signature;
}

// Express 示例
app.post('/api/webhook', (req, res) => {
  const signature = req.headers['x-configops-signature'];
  if (!verifyWebhook(req.rawBody, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  const event = JSON.parse(req.rawBody);
  console.log(event.event, event.data);
  res.json({ ok: true });
});`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
