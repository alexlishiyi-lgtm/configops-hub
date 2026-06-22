import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings2, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const configs = [
  { key: 'app.name', value: 'ConfigOps Demo', type: 'STRING', env: 'DEV', desc: '应用名称' },
  { key: 'app.port', value: '3000', type: 'NUMBER', env: 'DEV', desc: '应用端口' },
  { key: 'app.debug', value: 'true', type: 'BOOLEAN', env: 'DEV', desc: '调试模式' },
  { key: 'database.host', value: 'localhost', type: 'STRING', env: 'DEV', desc: '数据库地址' },
  { key: 'database.port', value: '5432', type: 'NUMBER', env: 'DEV', desc: '数据库端口' },
  { key: 'redis.url', value: 'redis://localhost:6379', type: 'STRING', env: 'DEV', desc: 'Redis 连接地址' },
];

const typeColors: Record<string, 'default' | 'success' | 'warning' | 'info' | 'gray'> = {
  STRING: 'default',
  NUMBER: 'info',
  BOOLEAN: 'success',
  JSON: 'warning',
};

export default function ConfigsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">配置中心</h1>
          <p className="text-sm text-[#6B7280] mt-1">管理所有环境配置项</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" />
          新建配置
        </Button>
      </div>

      {/* Environment tabs */}
      <div className="flex items-center gap-2">
        {['DEV', 'TEST', 'PROD'].map((env, i) => (
          <Badge key={env} variant={i === 0 ? 'default' : 'gray'} className="cursor-pointer px-4 py-1.5">
            {env}
          </Badge>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <Input placeholder="搜索配置项..." className="pl-10" />
      </div>

      {/* Config table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-[#4F46E5]" />
            配置列表 (6)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left py-3 px-2 text-xs font-medium text-[#6B7280]">Key</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-[#6B7280]">Value</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-[#6B7280]">类型</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-[#6B7280]">环境</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-[#6B7280]">描述</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config) => (
                <tr key={config.key} className="border-b border-[#F3F4F6] hover:bg-[#F8F9FB]">
                  <td className="py-3 px-2 font-mono text-sm font-medium text-[#1F2937]">{config.key}</td>
                  <td className="py-3 px-2 font-mono text-sm text-[#6B7280] max-w-[200px] truncate">{config.value}</td>
                  <td className="py-3 px-2"><Badge variant={typeColors[config.type]}>{config.type}</Badge></td>
                  <td className="py-3 px-2"><Badge variant="gray">{config.env}</Badge></td>
                  <td className="py-3 px-2 text-sm text-[#6B7280]">{config.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
