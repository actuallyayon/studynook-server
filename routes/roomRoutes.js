const express = require('express');
const router = express.Router();
const {
  createRoom,
  getRooms,
  getLatestRooms,
  getRoomById,
  getMyListings,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/latest', getLatestRooms);
router.get('/', getRooms);

// Private routes
router.post('/', authMiddleware, createRoom);
router.get('/my-listings', authMiddleware, getMyListings);

// Public get, private put/delete (with ownership check in controller)
router.get('/:id', getRoomById);
router.put('/:id', authMiddleware, updateRoom);
router.delete('/:id', authMiddleware, deleteRoom);

module.exports = router;
