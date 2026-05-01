const express = require('express');
const { body, query, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireProjectMember, requireProjectAdmin } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });
router.use(authenticate);

// All task routes are scoped under /api/projects/:projectId/tasks
// but also accessible at /api/tasks for cross-project views

// GET /api/projects/:projectId/tasks
router.get('/projects/:projectId/tasks', requireProjectMember, async (req, res) => {
  const { status, priority, assignedToId } = req.query;

  const where = {
    projectId: req.params.projectId,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(assignedToId && { assignedToId }),
  };

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(tasks);
});

// POST /api/projects/:projectId/tasks — any member can create
router.post(
  '/projects/:projectId/tasks',
  requireProjectMember,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('assignedToId').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, status, priority, dueDate, assignedToId } = req.body;

    // Validate assignee is a project member
    if (assignedToId) {
      const isMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: assignedToId, projectId: req.params.projectId } },
      });
      if (!isMember) return res.status(400).json({ message: 'Assignee is not a project member' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: req.params.projectId,
        createdById: req.user.id,
        assignedToId: assignedToId || null,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(task);
  }
);

// GET /api/tasks/:taskId
router.get('/tasks/:taskId', async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.taskId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });
  if (!task) return res.status(404).json({ message: 'Task not found' });

  // Verify user is a member of the task's project
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } },
  });
  if (!member) return res.status(403).json({ message: 'Access denied' });

  res.json(task);
});

// PUT /api/tasks/:taskId — member can update status; admin can update anything
router.put(
  '/tasks/:taskId',
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('dueDate').optional({ nullable: true }).isISO8601(),
    body('assignedToId').optional({ nullable: true }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } },
    });
    if (!member) return res.status(403).json({ message: 'Access denied' });

    const { title, description, status, priority, dueDate, assignedToId } = req.body;

    // Members can only update status; admins can update everything
    let updateData = {};
    if (member.role === 'ADMIN') {
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;
    }
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.task.update({
      where: { id: req.params.taskId },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  }
);

// DELETE /api/tasks/:taskId — admin only
router.delete('/tasks/:taskId', async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } },
  });
  if (!member || member.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  await prisma.task.delete({ where: { id: req.params.taskId } });
  res.json({ message: 'Task deleted' });
});

module.exports = router;
