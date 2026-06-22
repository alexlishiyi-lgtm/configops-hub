import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-bold">C</div>
            <span className="font-semibold text-[#1F2937] text-lg">ConfigOps Hub</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#1F2937]">创建账户</h1>
          <p className="text-sm text-[#6B7280] mt-1">免费开始使用，无需信用卡</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
          <RegisterForm />
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          已有账户？{' '}
          <Link href="/login" className="text-[#4F46E5] font-medium hover:underline">
            登录
          </Link>
        </p>

        <p className="text-center text-xs text-[#9CA3AF] mt-4">
          注册即表示同意服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
