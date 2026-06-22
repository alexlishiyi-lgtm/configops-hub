import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Settings2,
  Package,
  GitCommitHorizontal,
  Zap,
  Shield,
  Users,
  Check,
  ArrowRight,
} from 'lucide-react';

const features = [
  { icon: Settings2, title: '配置中心', desc: 'KV 编辑 + 环境隔离（dev/test/prod），支持 string/number/boolean/json 四种类型' },
  { icon: Zap, title: '配置推送', desc: 'Webhook + SDK（Python/Node），3 行代码接入，30 秒生效' },
  { icon: Package, title: '私有包仓库', desc: 'npm 代理 + pip 代理，私有包管理 + 公共包缓存，一地址搞定' },
  { icon: GitCommitHorizontal, title: '变更日志', desc: '谁改了什么，一目了然。支持版本对比和一键回滚' },
  { icon: Shield, title: 'API 密钥', desc: 'SDK 接入凭证管理，支持权限粒度控制和用量监控' },
  { icon: Users, title: '团队协作', desc: '多成员 + 角色权限（管理员/开发者/只读），适合 5-50 人团队' },
];

const pricing = [
  {
    name: '免费版',
    price: '¥0',
    period: '/月',
    desc: '适合个人开发者和小项目',
    features: ['3 个项目', '100 条配置项', '1GB 包存储', '1 个成员', '社区支持'],
    cta: '免费开始',
    highlight: false,
  },
  {
    name: '专业版',
    price: '¥59',
    period: '/月',
    desc: '适合小团队日常开发',
    features: ['无限项目', '无限配置项', '10GB 包存储', '5 个成员', 'Webhook 通知', '邮件支持'],
    cta: '开始试用',
    highlight: true,
  },
  {
    name: '团队版',
    price: '¥199',
    period: '/月',
    desc: '适合成长型团队',
    features: ['无限项目', '无限配置项', '50GB 包存储', '20 个成员', 'Webhook + 审计导出', '优先支持'],
    cta: '联系销售',
    highlight: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-[#E5E7EB] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="font-semibold text-[#1F2937]">ConfigOps Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">登录</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">免费试用</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <Badge variant="default" className="mb-6">🚀 12 周上线 · 中小团队首选</Badge>
        <h1 className="text-5xl font-bold text-[#1F2937] leading-tight mb-6">
          配置中心 + 包仓库 + 变更审计
          <br />
          <span className="text-[#4F46E5]">三合一，一个平台搞定</span>
        </h1>
        <p className="text-xl text-[#6B7280] mb-10 max-w-2xl mx-auto">
          专为 5-50 人开发团队设计。告别配置散落各处、包管理混乱、变更无追踪的痛苦。
          30 秒接入，让配置管理成为开发流程的必经之路。
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg">
              免费试用 <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">查看演示</Button>
          </Link>
        </div>
        <p className="text-sm text-[#9CA3AF] mt-6">无需信用卡 · 永久免费版 · 30 秒接入</p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1F2937] mb-4">一个平台，解决三个痛点</h2>
          <p className="text-[#6B7280]">不再需要 Nacos + Nexus + ELK 三个系统拼凑</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <h3 className="font-semibold text-[#1F2937] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1F2937] mb-4">简单透明的定价</h2>
          <p className="text-[#6B7280]">先免费使用，团队成长后再升级</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {pricing.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlight ? 'border-[#4F46E5] border-2 relative' : ''}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>推荐</Badge>
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="font-semibold text-[#1F2937] mb-1">{plan.name}</h3>
                <p className="text-sm text-[#6B7280] mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold text-[#1F2937]">{plan.price}</span>
                  <span className="text-[#9CA3AF]">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#6B7280]">
                      <Check className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block">
                  <Button
                    variant={plan.highlight ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-[#9CA3AF]">
          © 2026 ConfigOps Hub · 让配置管理更简单
        </div>
      </footer>
    </div>
  );
}
