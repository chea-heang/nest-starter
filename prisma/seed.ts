/**
 * prisma/seed.ts
 *
 * Seed script — populates the database with initial User data.
 *
 * Run:
 *   pnpm prisma:seed
 *   or: npx prisma db seed
 *
 * Strategy: upsert (idempotent — safe to re-run multiple times)
 */

import { PrismaClient } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as typeof import('bcrypt');

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────────────────────
const SALT_ROUNDS = 10;

interface SeedUser {
  name: string;
  email: string;
  password: string; // plain-text — hashed below
}

const users: SeedUser[] = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin@123',
  },
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'John@123',
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: 'Jane@123',
  },
  {
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    password: 'Bob@123',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main seeder
// ─────────────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('🌱 Starting database seed...\n');

  const db = prisma as any;
  const createdUsers: Record<string, any> = {};

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

    const seeded = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
      },
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
      },
    });

    createdUsers[user.email] = seeded;

    console.log(
      `  ✅ User seeded: ${seeded.email} (id: ${seeded.id})`,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Seed Posts & Comments
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📝 Seeding blog posts & comments...');

  const admin = createdUsers['admin@example.com'];
  const john = createdUsers['john.doe@example.com'];
  const jane = createdUsers['jane.smith@example.com'];

  if (admin && john && jane) {
    const post1 = await db.post.upsert({
      where: { slug: 'getting-started-with-nestjs-and-prisma' },
      update: {},
      create: {
        title: 'Getting Started with NestJS and Prisma',
        slug: 'getting-started-with-nestjs-and-prisma',
        summary: 'Learn how to build scalable fullstack APIs using NestJS and Prisma ORM.',
        content: 'NestJS is a progressive Node.js framework for building efficient, reliable, and scalable server-side applications. Combined with Prisma ORM, developers get type-safe database queries and seamless migrations.',
        published: true,
        authorId: admin.id,
      },
    });
    console.log(`  📄 Post seeded: "${post1.title}"`);

    const post2 = await db.post.upsert({
      where: { slug: 'mastering-jwt-authentication-with-refresh-tokens' },
      update: {},
      create: {
        title: 'Mastering JWT Authentication with Refresh Tokens',
        slug: 'mastering-jwt-authentication-with-refresh-tokens',
        summary: 'A complete guide to implementing secure JWT token rotation strategy.',
        content: 'Token rotation ensures that whenever a refresh token is used, a new pair of access and refresh tokens is issued, invalidating previous refresh tokens and preventing token reuse attacks.',
        published: true,
        authorId: john.id,
      },
    });
    console.log(`  📄 Post seeded: "${post2.title}"`);

    // Add comments
    const commentCount = await db.comment.count({ where: { postId: post1.id } });
    if (commentCount === 0) {
      await db.comment.createMany({
        data: [
          {
            content: 'Awesome tutorial! The database relations are so clean.',
            postId: post1.id,
            authorId: john.id,
          },
          {
            content: 'Very helpful, thanks for sharing this guide!',
            postId: post1.id,
            authorId: jane.id,
          },
        ],
      });
      console.log(`  💬 Comments seeded for post: "${post1.title}"`);
    }
  }

  console.log(`\n🎉 Seed completed successfully.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────────────────────
main()
  .catch((error: unknown) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
