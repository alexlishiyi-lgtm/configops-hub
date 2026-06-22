import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Plus, Upload } from 'lucide-react';

const packages = [
  { name: '@demo/utils', version: '1.2.0', desc: '通用工具函数库', size: '24 KB', downloads: 156, isPrivate: true },
  { name: '@demo/types', version: '0.5.1', desc: 'TypeScript 类型定义', size: '12 KB', downloads: 89, isPrivate: true },
  { name: 'lodash', version: '4.17.21', desc: '代理缓存 - lodash', size: '139 KB', downloads: 1247, isPrivate: false },
  { name: 'express', version: '4.18.2', desc: '代理缓存 - express', size: '207 KB', downloads: 3421, isPrivate: false },
];

export default function PackagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">包仓库</h1>
          <p className="text-sm text-[#6B7280] mt-1">私有包管理 + 公共包代理缓存</p>
        </div>
        <Button>
          <Upload className="w-4 h-4" />
          发布包
        </Button>
      </div>

      {/* Scope tabs */}
      <div className="flex items-center gap-2">
        <Badge variant="default" className="cursor-pointer px-4 py-1.5">npm</Badge>
        <Badge variant="gray" className="cursor-pointer px-4 py-1.5">pip</Badge>
      </div>

      {/* Proxy banner */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-4 flex items-center gap-3">
        <Package className="w-5 h-5 text-[#3B82F6]" />
        <div className="flex-1">
          <p className="text-sm font-medium text-[#1F2937]">代理源已启用</p>
          <p className="text-xs text-[#6B7280] font-mono">https://npm.configops.dev/proxy</p>
        </div>
        <Badge variant="info">运行中</Badge>
      </div>

      {/* Package grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <Card key={pkg.name} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#FFFBEB] flex items-center justify-center">
                  <Package className="w-4 h-4 text-[#F59E0B]" />
                </div>
                {pkg.isPrivate ? (
                  <Badge variant="warning">私有</Badge>
                ) : (
                  <Badge variant="gray">代理</Badge>
                )}
              </div>
              <h3 className="font-mono text-sm font-medium text-[#1F2937] mb-1">{pkg.name}</h3>
              <p className="text-xs text-[#6B7280] mb-3 line-clamp-1">{pkg.desc}</p>
              <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                <span>v{pkg.version}</span>
                <span>{pkg.size}</span>
                <span>{pkg.downloads} 次下载</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
