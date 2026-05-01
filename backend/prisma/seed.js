const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskflow.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@taskflow.com',
      password: hashedPassword,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@taskflow.com' },
    update: {},
    create: {
      name: 'Member User',
      email: 'member@taskflow.com',
      password: hashedPassword,
    },
  });

  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      name: 'Demo Project',
      description: 'A sample project to get you started',
      createdById: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: member.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.task.createMany({
    skipDuplicates: true,
    data: [
      {
        title: 'Set up project structure',
        description: 'Initialize the repository and configure tooling',
        status: 'DONE',
        priority: 'HIGH',
        projectId: project.id,
        createdById: admin.id,
        assignedToId: admin.id,
      },
      {
        title: 'Design database schema',
        description: 'Create ERD and define all models',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: project.id,
        createdById: admin.id,
        assignedToId: member.id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Build REST API',
        description: 'Implement all CRUD endpoints',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: project.id,
        createdById: admin.id,
        assignedToId: member.id,
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // overdue
      },
    ],
  });

  console.log('Seed complete:', { admin: admin.email, member: member.email });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
