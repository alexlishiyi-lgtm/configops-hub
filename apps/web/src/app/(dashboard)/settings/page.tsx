'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Key, CreditCard, Webhook, Plus, Trash2, Loader2, Shield, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApiKeysTab } from '@/components/settings/ApiKeysTab';
import { WebhooksTab } from '@/components/settings/WebhooksTab';

type Tab = 'members' | 'apikeys' | 'billing' | 'webhooks';

interface Member {
  id: string;
  role: 'ADMIN' | 'DEVELOPER' | 'VIEWER';
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  createdAt: string;
}

const roleConfig: Record<string, { label: string; variant: 'default' | 'info' | 'gray'; icon: typeof Crown }> = {
  ADMIN: { label: '管理员', variant: 'default', icon: Crown },
  DEVELOPER: { label: '开发者', variant: 'info', icon: Shield },
  VIEWER: { label: '只读', variant: 'gray', icon: Users },
};

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'DEVELOPER' | 'VIEWER'>('DEVELOPER');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/members');
      if (!res.ok) {
        setMembers([]);
        return;
      }
      const data = await res.json();
      setMembers(data.members || []);
      setCurrentUserId(data.currentUserId || '');
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async () => {
    setInviting(true);
    setInviteError(null);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || '邀请失败');
        return;
      }
      setInviteEmail('');
      fetchMembers();
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: 'ADMIN' | 'DEVELOPER' | 'VIEWER') => {
    setUpdatingRole(memberId);
    try {
      const res = await fetch('/api/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role }),
      });
      if (res.ok) {
        fetchMembers();
      }
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('确定要移除该成员吗？')) return;
    await fetch(`/api/members?memberId=${memberId}`, { method: 'DELETE' });
    fetchMembers();
  };

  const tabs = [
    { id: 'members' as const, label: '团队成员', icon: Users },
    { id: 'apikeys' as const, label: 'API 密钥', icon: Key },
    { id: 'billing' as const, label: '订阅计费', icon: CreditCard },
    { id: 'webhooks' as const, label: 'Webhook', icon: Webhook },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937]">设置</h1>
        <p className="text-sm text-[#6B7280] mt-1">管理团队、密钥和计费</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E5E7EB]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t.id
                ? 'text-[#4F46E5] border-[#4F46E5]'
                : 'text-[#6B7280] border-transparent hover:text-[#1F2937]'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {tab === 'members' && (
        <div className="space-y-6">
          {/* Invite */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">邀请成员</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="输入邮箱地址..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'DEVELOPER' | 'VIEWER')}
                  className="h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#1F2937] focus:border-[#4F46E5] focus:outline-none"
                >
                  <option value="DEVELOPER">开发者</option>
                  <option value="VIEWER">只读</option>
                </select>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
                  {inviting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Plus className="w-4 h-4" />
                  邀请
                </Button>
              </div>
              {inviteError && (
                <p className="mt-2 text-sm text-[#EF4444]">{inviteError}</p>
              )}
              <p className="mt-2 text-xs text-[#9CA3AF]">用户需先注册账号后才能被邀请加入团队</p>
            </CardContent>
          </Card>

          {/* Member list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">团队成员 ({members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-[#9CA3AF] animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => {
                    const roleInfo = roleConfig[member.role];
                    const isCurrentUser = member.user.id === currentUserId;
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] hover:bg-[#F8F9FB]"
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-sm font-medium">
                          {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#1F2937]">
                              {member.user.name || member.user.email}
                            </p>
                            {isCurrentUser && (
                              <Badge variant="gray">你</Badge>
                            )}
                          </div>
                          <p className="text-xs text-[#9CA3AF] truncate">{member.user.email}</p>
                        </div>
                        {/* Role selector */}
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as 'ADMIN' | 'DEVELOPER' | 'VIEWER')}
                          disabled={updatingRole === member.id || isCurrentUser}
                          className="h-8 px-2 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#1F2937] focus:border-[#4F46E5] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="ADMIN">管理员</option>
                          <option value="DEVELOPER">开发者</option>
                          <option value="VIEWER">只读</option>
                        </select>
                        {/* Remove */}
                        {!isCurrentUser && (
                          <button
                            onClick={() => handleRemove(member.id)}
                            className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#EF4444] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Keys Tab */}
      {tab === 'apikeys' && <ApiKeysTab />}

      {/* Billing Tab (placeholder for Sprint 6) */}
      {tab === 'billing' && (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
            <p className="text-sm text-[#6B7280]">订阅计费将在 Sprint 6 上线</p>
            <p className="text-xs text-[#9CA3AF] mt-1">当前为免费版，可使用全部基础功能</p>
          </CardContent>
        </Card>
      )}

      {/* Webhooks Tab */}
      {tab === 'webhooks' && <WebhooksTab />}
    </div>
  );
}
