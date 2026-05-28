import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Notification } from '../models/Notification';

const router = Router();

// Middleware to restrict routes to Admins only
const requireAdmin = async (req: AuthRequest, res: Response, next: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin role required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: 'Authorization check failed' });
  }
};

// ─── GET /api/notifications ──────────────────────────────────────────────────
// Retrieve all broadcast notifications (Available to all logged in users)
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// ─── POST /api/notifications ─────────────────────────────────────────────────
// Broadcast a new notification (Admin only)
router.post('/', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, category } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Title and message are required' });
    }

    const notification = new Notification({
      title,
      message,
      category: category || 'info'
    });

    await notification.save();
    // Emit creation event to all connected clients
    const { io } = require('../index');
    io.emit('notificationCreated', notification);
    res.status(201).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to broadcast notification' });
  }
});

// ─── PUT /api/notifications/:id ──────────────────────────────────────────────
// Edit an existing notification (Admin only)
router.put('/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, category } = req.body;
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    if (title) notification.title = title;
    if (message) notification.message = message;
    if (category) notification.category = category;

    await notification.save();
    // Emit update event
    const { io } = require('../index');
    io.emit('notificationUpdated', notification);
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

// ─── DELETE /api/notifications/clear-all ────────────────────────────────────
// Remove all broadcast notifications (Admin only)
router.delete('/clear-all', requireAuth, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    await Notification.deleteMany({});
    const { io } = require('../index');
    io.emit('notificationDeleted', { all: true });
    res.json({ success: true, message: 'All notifications cleared successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to clear notifications' });
  }
});

// ─── DELETE /api/notifications/:id ───────────────────────────────────────────
// Delete an existing notification (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    // Emit delete event with id
    const { io } = require('../index');
    io.emit('notificationDeleted', { _id: req.params.id });
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
});

export default router;
