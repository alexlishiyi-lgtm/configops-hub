import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  // 创建测试用户
  const passwordHash = await bcrypt.hash('test123456', 12);

  const user = await db.user.upsert({
    where: { email: 'demo@configops.dev' },
    update: {},
    create: {
      email: 'demo@configops.dev',
      name: '演示用户',
      password: passwordHash,
    },
  });

  // 创建默认 Workspace
  const workspace = await db.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: '演示团队',
      slug: 'demo-workspace',
      plan: 'FREE',
      members: {
        create: {
          userId: user.id,
          role: 'ADMIN',
        },
      },
    },
  });

  // 创建示例配置
  const configs = [
    { key: 'app.name', value: 'ConfigOps Demo', type: 'STRING' as const, environment: 'DEV' as const, description: '应用名称' },
    { key: 'app.port', value: '3000', type: 'NUMBER' as const, environment: 'DEV' as const, description: '应用端口' },
    { key: 'app.debug', value: 'true', type: 'BOOLEAN' as const, environment: 'DEV' as const, description: '调试模式' },
    { key: 'database.host', value: 'localhost', type: 'STRING' as const, environment: 'DEV' as const, description: '数据库地址' },
    { key: 'database.port', value: '5432', type: 'NUMBER' as const, environment: 'DEV' as const, description: '数据库端口' },
    { key: 'redis.url', value: 'redis://localhost:6379', type: 'STRING' as const, environment: 'DEV' as const, description: 'Redis 连接地址' },
  ];

  for (const config of configs) {
    const existing = await db.config.findFirst({
      where: { workspaceId: workspace.id, key: config.key, environment: config.environment },
    });
    if (!existing) {
      await db.config.create({
        data: {
          ...config,
          workspaceId: workspace.id,
          snapshots: {
            create: {
              version: 1,
              value: config.value,
              changedBy: user.id,
              changeType: 'CREATED',
            },
          },
        },
      });
    }
  }

  // 创建示例包
  const packages = [
    { name: '@demo/utils', version: '1.2.0', description: '通用工具函数库', size: 24576 },
    { name: '@demo/types', version: '0.5.1', description: 'TypeScript 类型定义', size: 12288 },
    { name: 'lodash', version: '4.17.21', description: '代理缓存 - lodash', size: 139264, isPrivate: false },
  ];

  for (const pkg of packages) {
    const existing = await db.package.findFirst({
      where: { workspaceId: workspace.id, name: pkg.name },
    });
    if (!existing) {
      await db.package.create({
        data: {
          ...pkg,
          scope: 'NPM',
          workspaceId: workspace.id,
        },
      });
    }
  }

  console.log('✅ 种子数据创建完成');
  console.log(`   用户: ${user.email} (密码: test123456)`);
  console.log(`   工作区: ${workspace.name} (${workspace.slug})`);
  console.log(`   配置项: ${configs.length} 条`);
  console.log(`   包: ${packages.length} 个`);
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
