const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Require ADMIN role within a project
const requireProjectAdmin = async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;
  const userId = req.user.id;

  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });

  if (!member || member.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  req.projectMember = member;
  next();
};

// Require membership in a project (any role)
const requireProjectMember = async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;
  const userId = req.user.id;

  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });

  if (!member) {
    return res.status(403).json({ message: 'Not a member of this project' });
  }
  req.projectMember = member;
  next();
};

module.exports = { authenticate, requireProjectAdmin, requireProjectMember };
