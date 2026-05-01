const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/projects — list projects the user belongs to
router.get('/', async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: req.user.id } } },
    include: {
      _count: { select: { tasks: true, members: true } },
      members: {
        where: { userId: req.user.id },
        select: { role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(projects);
});

// POST /api/projects — create project (creator becomes ADMIN)
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        createdById: req.user.id,
        members: { create: { userId: req.user.id, role: 'ADMIN' } },
      },
      include: { _count: { select: { tasks: true, members: true } } },
    });
    res.status(201).json(project);
  }
);

// GET /api/projects/:id
router.get('/:id', requireProjectMember, async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { tasks: true } },
    },
  });
  res.json(project);
});

// PUT /api/projects/:id — admin only
router.put(
  '/:id',
  requireProjectAdmin,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(description !== undefined && { description }) },
    });
    res.json(project);
  }
);

// DELETE /api/projects/:id — admin only
router.delete('/:id', requireProjectAdmin, async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ message: 'Project deleted' });
});

// POST /api/projects/:id/members — invite member (admin only)
router.post(
  '/:id/members',
  requireProjectAdmin,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('role').optional().isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, role = 'MEMBER' } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: req.params.id } },
    });
    if (existing) return res.status(409).json({ message: 'User is already a member' });

    const member = await prisma.projectMember.create({
      data: { userId: user.id, projectId: req.params.id, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(member);
  }
);

// PUT /api/projects/:id/members/:userId — change role (admin only)
router.put(
  '/:id/members/:userId',
  requireProjectAdmin,
  [body('role').isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const member = await prisma.projectMember.update({
      where: { userId_projectId: { userId: req.params.userId, projectId: req.params.id } },
      data: { role: req.body.role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json(member);
  }
);

// DELETE /api/projects/:id/members/:userId — remove member (admin only)
router.delete('/:id/members/:userId', requireProjectAdmin, async (req, res) => {
  await prisma.projectMember.delete({
    where: { userId_projectId: { userId: req.params.userId, projectId: req.params.id } },
  });
  res.json({ message: 'Member removed' });
});

module.exports = router;
