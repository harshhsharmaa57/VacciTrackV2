import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { queryVaxbot } from '../utils/vaxbotService.js';

const router = express.Router();

// @route   POST /api/chat/ask
// @desc    Query the AI Pediatric & Vaccine Assistant
// @access  Public (no login needed so parents can ask questions anytime)
router.post(
  '/ask',
  asyncHandler(async (req, res) => {
    const { message, context } = req.body;

    const result = await queryVaxbot(message, context);

    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;
