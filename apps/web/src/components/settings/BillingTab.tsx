'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Check, Loader2, Crown, Zap, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionData {
  plan: 'FREE' | 'PRO' | 'TEAM';
  planLabel: string;
  price: number;
  limits: {
    maxConfigs: number | null;
    maxMembers: number | null;
    maxPackages: number | null;
    maxStorage: number | null;
    maxStorageLabel: string;
    webhooksEnabled: boolean;
    rollbackEnabled: boolean;
    npmRegistry: boolean;
  };
  usage: {
    configCount: number;
    memberCount: number;
    packageCount: number;
    storageUsed: number;
    storageUsedLabel: string;
  };
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    stripeCustomerId: string | null;
  } | null;
  features: string[];
}

const plans = [
  {
    id: 'FREE' as const,
    name: '免费版',
    price: 0,
    desc: '适合个人开发者',
    icon: Users,
    color: 'gray',
    features: ['100 条配置项', '1GB 包存储', '1 个成员', '基础 SDK 拉取'],
  },
  {
    id: 'PRO' as const,
    name: '专业版',
    price: 59,
    desc: '适合小团队日常开发',
    icon: Zap,
    color: 'default',
    features: ['无限配置项', '10GB 包存储', '10 个成员', 'Webhook 通知', '版本回滚', 'npm Registry'],
  },
  {
    id: 'TEAM' as const,
    name: '团队版',
    price: 199,
    desc: '适合成长型团队',
    icon: Crown,
    color: 'default',
    features: ['无限配置项', '50GB 包存储', '无限成员', 'Webhook + 审计导出', '版本回滚', 'npm Registry', '优先支持'],
  },
];

export function BillingTab() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/subscription');
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleUpgrade = async (plan: 'PRO' | 'TEAM') => {
    setActionLoading(plan);
    setMessage(null);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();

      if (json.url) {
        window.location.href = json.url;
      } else if (json.devMode) {
        setMessage({ type: 'success', text: json.message });
        fetchSubscription();
      } else {
        setMessage({ type: 'error', text: json.error || '升级失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleManage = async () => {
    setActionLoading('manage');
    setMessage(null);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const json = await res.json();

      if (json.url) {
        window.location.href = json.url;
      } else if (json.devMode) {
        setMessage({ type: 'info', text: json.message });
        fetchSubscription();
      } else {
        setMessage({ type: 'error', text: json.error || '操作失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#9CA3AF] animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-[#6B7280]">
          无法加载订阅信息，请刷新页面重试。
        </CardContent>
      </Card>
    );
  }

  const usageItems = [
    {
      label: '配置项',
      current: data.usage.configCount,
      max: data.limits.maxConfigs,
      icon: TrendingUp,
    },
    {
      label: '团队成员',
      current: data.usage.memberCount,
      max: data.limits.maxMembers,
      icon: Users,
    },
    {
      label: '包数量',
      current: data.usage.packageCount,
      max: data.limits.maxPackages,
      icon: TrendingUp,
    },
    {
      label: '存储空间',
      current: data.usage.storageUsed,
      currentLabel: data.usage.storageUsedLabel,
      max: data.limits.maxStorage,
      maxLabel: data.limits.maxStorageLabel,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      {message && (
        <div className={cn(
          'rounded-lg p-4 flex items-start gap-3 text-sm',
          message.type === 'success' && 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]',
          message.type === 'error' && 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]',
          message.type === 'info' && 'bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]',
        )}>
          {message.type === 'success' && <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          {message.type === 'error' && <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          {message.type === 'info' && <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#4F46E5]" />
            当前计划
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-bold text-[#1F2937]">{data.planLabel}</h3>
                <Badge variant={data.plan === 'FREE' ? 'gray' : 'default'}>
                  ¥{data.price}/月
                </Badge>
                {data.subscription?.status === 'ACTIVE' && data.plan !== 'FREE' && (
                  <Badge variant="success">已激活</Badge>
                )}
                {data.subscription?.status === 'PAST_DUE' && (
                  <Badge variant="danger">支付逾期</Badge>
                )}
              </div>
              {data.subscription?.currentPeriodEnd && (
                <p className="text-xs text-[#9CA3AF]">
                  下次续费日期：{new Date(data.subscription.currentPeriodEnd).toLocaleDateString('zh-CN')}
                  {data.subscription.cancelAtPeriodEnd && ' · 到期后取消'}
                </p>
              )}
              {data.plan === 'FREE' && (
                <p className="text-xs text-[#9CA3AF]">升级解锁更多功能和更高限额</p>
              )}
            </div>
            {data.plan !== 'FREE' && (
              <Button variant="outline" size="sm" onClick={handleManage} disabled={actionLoading === 'manage'}>
                {actionLoading === 'manage' && <Loader2 className="w-4 h-4 animate-spin" />}
                管理订阅
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">用量统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {usageItems.map((item) => {
              const max = item.max;
              const percent = max ? Math.min((item.current / max) * 100, 100) : 0;
              const isNearLimit = max !== null && percent >= 80;
              const isAtLimit = max !== null && percent >= 100;

              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">{item.label}</span>
                    <span className={cn(
                      'font-medium',
                      isAtLimit ? 'text-[#EF4444]' : isNearLimit ? 'text-[#F59E0B]' : 'text-[#1F2937]'
                    )}>
                      {item.currentLabel || item.current}
                      {max !== null && ` / ${item.maxLabel || max}`}
                      {max === null && ' / 无限'}
                    </span>
                  </div>
                  {max !== null && (
                    <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          isAtLimit ? 'bg-[#EF4444]' : isNearLimit ? 'bg-[#F59E0B]' : 'bg-[#4F46E5]'
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                  {max === null && (
                    <div className="h-2 rounded-full bg-[#ECFDF5]" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Feature flags */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Webhook 通知', enabled: data.limits.webhooksEnabled },
              { label: '版本回滚', enabled: data.limits.rollbackEnabled },
              { label: 'npm Registry', enabled: data.limits.npmRegistry },
            ].map((feature) => (
              <div
                key={feature.label}
                className={cn(
                  'rounded-lg border p-3 text-center',
                  feature.enabled
                    ? 'border-[#A7F3D0] bg-[#ECFDF5]'
                    : 'border-[#E5E7EB] bg-[#F9FAFB]'
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-full mx-auto mb-1.5 flex items-center justify-center',
                  feature.enabled ? 'bg-[#10B981]' : 'bg-[#D1D5DB]'
                )}>
                  {feature.enabled && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <p className={cn(
                  'text-xs font-medium',
                  feature.enabled ? 'text-[#065F46]' : 'text-[#9CA3AF]'
                )}>
                  {feature.label}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">升级计划</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = data.plan === plan.id;
              const isDowngrade = plans.findIndex(p => p.id === plan.id) < plans.findIndex(p => p.id === data.plan);

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'rounded-xl border p-5 relative',
                    isCurrent ? 'border-[#4F46E5] border-2 bg-[#EEF2FF]' : 'border-[#E5E7EB] bg-white'
                  )}
                >
                  {isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge>当前</Badge>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      plan.id === 'FREE' ? 'bg-[#F3F4F6]' : 'bg-[#4F46E5]'
                    )}>
                      <plan.icon className={cn(
                        'w-4 h-4',
                        plan.id === 'FREE' ? 'text-[#6B7280]' : 'text-white'
                      )} />
                    </div>
                    <h3 className="font-semibold text-[#1F2937]">{plan.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-bold text-[#1F2937]">¥{plan.price}</span>
                    <span className="text-xs text-[#9CA3AF]">/月</span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-[#6B7280]">
                        <Check className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      当前计划
                    </Button>
                  ) : isDowngrade ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleManage}
                      disabled={actionLoading !== null}
                    >
                      降级需联系管理
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleUpgrade(plan.id as 'PRO' | 'TEAM')}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === plan.id && <Loader2 className="w-4 h-4 animate-spin" />}
                      升级到{plan.name}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-[#9CA3AF] text-center">
            {process.env.NEXT_PUBLIC_STRIPE_ENABLED
              ? '支付由 Stripe 安全处理，支持支付宝、微信支付'
              : '开发模式：无需真实支付，点击升级即可切换计划'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
