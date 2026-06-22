import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-bold">C</div>
            <span className="font-semibold text-[#1F2937] text-lg">ConfigOps Hub</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#1F2937]">欢迎回来</h1>
          <p className="text-sm text-[#6B7280] mt-1">登录到你的账户</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8">
          <LoginForm />
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          还没有账户？{' '}
          <Link href="/register" className="text-[#4F46E5] font-medium hover:underline">
            免费注册
          </Link>
        </p>
      </div>
    </div>
  );
}
