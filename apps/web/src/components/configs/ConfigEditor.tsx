'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';

interface ConfigEditorProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  config?: {
    id: string;
    key: string;
    value: string;
    type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    environment: 'DEV' | 'TEST' | 'PROD';
    description?: string | null;
  } | null;
  defaultEnv?: 'DEV' | 'TEST' | 'PROD';
}

const typeOptions = [
  { value: 'STRING', label: 'String' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'BOOLEAN', label: 'Boolean' },
  { value: 'JSON', label: 'JSON' },
] as const;

const envOptions = [
  { value: 'DEV', label: 'DEV', color: 'gray' as const },
  { value: 'TEST', label: 'TEST', color: 'info' as const },
  { value: 'PROD', label: 'PROD', color: 'warning' as const },
] as const;

export function ConfigEditor({ open, onClose, onSaved, config, defaultEnv = 'DEV' }: ConfigEditorProps) {
  const isEdit = !!config;
  const [key, setKey] = useState(config?.key ?? '');
  const [value, setValue] = useState(config?.value ?? '');
  const [type, setType] = useState<'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON'>(config?.type ?? 'STRING');
  const [environment, setEnvironment] = useState<'DEV' | 'TEST' | 'PROD'>(config?.environment ?? defaultEnv);
  const [description, setDescription] = useState(config?.description ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isEdit ? `/api/configs/${config!.id}` : '/api/configs';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit
        ? { value, description: description || null }
        : { key, value, type, environment, description: description || null };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '操作失败');
        return;
      }

      onSaved();
      onClose();
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
          <h2 className="text-lg font-semibold text-[#1F2937]">
            {isEdit ? '编辑配置' : '新建配置'}
          </h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1F2937]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Key */}
          <div className="space-y-1.5">
            <Label>配置键名 (Key)</Label>
            {isEdit ? (
              <div className="px-3 py-2 rounded-lg bg-[#F8F9FB] border border-[#E5E7EB] font-mono text-sm text-[#6B7280]">
                {key}
              </div>
            ) : (
              <>
                <Input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="如 database.host"
                  className="font-mono"
                  required
                />
                <p className="text-xs text-[#9CA3AF]">只能包含字母、数字、点、下划线、短横线</p>
              </>
            )}
          </div>

          {/* Type */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>类型</Label>
              <div className="flex gap-2">
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      type === opt.value
                        ? 'bg-[#4F46E5] text-white'
                        : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Environment */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>环境 <span className="text-[#EF4444]">*</span></Label>
              <div className="flex gap-2">
                {envOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEnvironment(opt.value)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      environment === opt.value
                        ? 'bg-[#4F46E5] text-white'
                        : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      environment === opt.value ? 'bg-white/80' :
                      opt.value === 'DEV' ? 'bg-[#6B7280]' :
                      opt.value === 'TEST' ? 'bg-[#2563EB]' : 'bg-[#D97706]'
                    }`} />
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#9CA3AF]">
                当前将在 <span className="font-semibold text-[#4F46E5]">{environment}</span> 环境下创建此配置项
              </p>
            </div>
          )}

          {/* Value */}
          <div className="space-y-1.5">
            <Label>值 (Value)</Label>
            {type === 'JSON' ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full min-h-[100px] rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 font-mono text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                required
              />
            ) : type === 'BOOLEAN' ? (
              <div className="flex gap-2">
                {['true', 'false'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setValue(v)}
                    className={`px-4 py-2 rounded-lg text-sm font-mono font-medium transition-colors ${
                      value === v
                        ? 'bg-[#4F46E5] text-white'
                        : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            ) : (
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === 'NUMBER' ? '如 5432' : '如 localhost'}
                className="font-mono"
                required
              />
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>描述 (可选)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="如 数据库连接地址"
            />
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
              {isEdit ? '保存修改' : '创建配置'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
