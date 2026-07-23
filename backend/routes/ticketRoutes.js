const express = require('express');
const router = express.Router();
const { 
  createTicket, 
  getTickets, 
  addMessage, 
  updateTicket 
} = require('../controllers/ticketController');
const { protect } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all ticket routes
router.use(protect);

// GET /api/v1/tickets - Fetch tickets
// POST /api/v1/tickets - Create a new ticket
router.route('/')
  .get(getTickets)
  .post(createTicket);

// PATCH /api/v1/tickets/:id - Update status or assign to a team member
router.route('/:id')
  .patch(updateTicket);

// POST /api/v1/tickets/:id/message - Add a chat reply to the ticket
router.route('/:id/message')
  .post(addMessage);

module.exports = router;