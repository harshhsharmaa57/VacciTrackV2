import express from 'express';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
}));

export default router;


