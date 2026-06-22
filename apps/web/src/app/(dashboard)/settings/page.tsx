'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Key, CreditCard, Webhook, Plus, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'team', label: '团队成员', icon: Users },
  { id: 'apikeys', label: 'API 密钥', icon: Key },
  { id: 'billing', label: '订阅计费', icon: CreditCard },
  { id: 'webhooks', label: 'Webhook', icon: Webhook },
];

const members = [
  { name: '演示用户', email: 'demo@configops.dev', role: '管理员', initials: '演' },
];

const apiKeys = [
  { name: 'Production Server', prefix: 'cop_a1b2c3d4...', created: '2026-06-22', lastUsed: '2 分钟前' },
];

const webhooks = [
  { url: 'https://hooks.example.com/configops', events: ['config.update', 'config.push'], active: true },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('team');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937]">设置</h1>
        <p className="text-sm text-[#6B7280] mt-1">管理团队、密钥、计费和通知</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E5E7EB]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.id
                ? 'border-[#4F46E5] text-[#4F46E5]'
                : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Team tab */}
      {activeTab === 'team' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1F2937]">团队成员 (1)</h2>
              <Button size="sm"><Plus className="w-3 h-3" /> 邀请成员</Button>
            </div>
            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.email} className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB]">
                  <div className="w-9 h-9 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-sm font-medium">
                    {m.initials}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1F2937]">{m.name}</p>
                    <p className="text-xs text-[#9CA3AF]">{m.email}</p>
                  </div>
                  <Badge variant="default">{m.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys tab */}
      {activeTab === 'apikeys' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1F2937]">API 密钥 (1)</h2>
              <Button size="sm"><Plus className="w-3 h-3" /> 新建密钥</Button>
            </div>
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div key={key.name} className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB]">
                  <div className="w-9 h-9 rounded-lg bg-[#FFFBEB] flex items-center justify-center">
                    <Key className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1F2937]">{key.name}</p>
                    <p className="text-xs text-[#9CA3AF] font-mono">{key.prefix}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#9CA3AF]">最后使用: {key.lastUsed}</p>
                    <p className="text-xs text-[#9CA3AF]">创建: {key.created}</p>
                  </div>
                  <Button variant="ghost" size="icon"><Copy className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-[#EF4444]" /></Button>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-lg bg-[#1E1E2E] text-[#CDD6F4] font-mono text-xs">
              <p className="text-[#6C7086] mb-2"># SDK 接入示例 (3 行代码)</p>
              <p><span className="text-[#F9E2AF]">import</span> {'{ ConfigOps }'} <span className="text-[#F9E2AF]">from</span> <span className="text-[#A6E3A1]">'@configops/sdk'</span></p>
              <p><span className="text-[#F9E2AF]">const</span> client = <span className="text-[#F9E2AF]">new</span> ConfigOps(<span className="text-[#A6E3A1]">'cop_your_key'</span>)</p>
              <p><span className="text-[#F9E2AF]">const</span> config = <span className="text-[#F9E2AF]">await</span> client.get(<span className="text-[#A6E3A1]">'database.host'</span>)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing tab */}
      {activeTab === 'billing' && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-[#1F2937] mb-4">当前订阅</h2>
            <div className="p-4 rounded-lg border border-[#E5E7EB] mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-[#1F2937]">免费版</p>
                  <p className="text-sm text-[#6B7280]">¥0/月 · 永久免费</p>
                </div>
                <Badge variant="success">使用中</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">配置项</span>
                  <span className="text-[#1F2937]">6 / 100</span>
                </div>
                <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: '6%' }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">包存储</span>
                  <span className="text-[#1F2937]">0.4 GB / 1 GB</span>
                </div>
                <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#10B981] rounded-full" style={{ width: '40%' }} />
                </div>
              </div>
            </div>
            <Button>升级到专业版 (¥59/月)</Button>
          </CardContent>
        </Card>
      )}

      {/* Webhooks tab */}
      {activeTab === 'webhooks' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1F2937]">Webhook 通知 (1)</h2>
              <Button size="sm"><Plus className="w-3 h-3" /> 新建 Webhook</Button>
            </div>
            <div className="space-y-3">
              {webhooks.map((wh, i) => (
                <div key={i} className="p-3 rounded-lg border border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-mono text-[#1F2937]">{wh.url}</p>
                    <Badge variant={wh.active ? 'success' : 'gray'}>
                      {wh.active ? '活跃' : '停用'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {wh.events.map((e) => (
                      <Badge key={e} variant="info">{e}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
