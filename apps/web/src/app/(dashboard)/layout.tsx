import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Get workspace info for the sidebar/topbar
  const member = await db.member.findFirst({
    where: { userId: session.user.id },
    include: {
      workspace: {
        select: { id: true, name: true, slug: true, plan: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!member) {
    // User has no workspace — this shouldn't happen for registered users
    // but we handle it gracefully
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Sidebar workspace={member.workspace} role={member.role} />
      <Topbar user={session.user} workspaceName={member.workspace.name} />
      <main className="ml-[220px] mt-14 p-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
