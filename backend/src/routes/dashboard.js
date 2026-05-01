const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/dashboard — aggregated stats for the current user
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  // Projects the user belongs to
  const projectIds = (
    await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    })
  ).map((m) => m.projectId);

  const [
    totalProjects,
    totalTasks,
    todoTasks,
    inProgressTasks,
    doneTasks,
    overdueTasks,
    myTasks,
    recentTasks,
  ] = await Promise.all([
    prisma.project.count({ where: { id: { in: projectIds } } }),
    prisma.task.count({ where: { projectId: { in: projectIds } } }),
    prisma.task.count({ where: { projectId: { in: projectIds }, status: 'TODO' } }),
    prisma.task.count({ where: { projectId: { in: projectIds }, status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { projectId: { in: projectIds }, status: 'DONE' } }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: now },
        status: { not: 'DONE' },
      },
    }),
    prisma.task.findMany({
      where: { assignedToId: userId, status: { not: 'DONE' } },
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
    prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  res.json({
    stats: {
      totalProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      overdueTasks,
    },
    myTasks,
    recentTasks,
  });
});

module.exports = router;
