const Room = require('../models/Room');
const Booking = require('../models/Booking');

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private
const createRoom = async (req, res) => {
  try {
    const { name, description, image, floor, capacity, hourlyRate, amenities } = req.body;

    const room = await Room.create({
      name,
      description,
      image,
      floor,
      capacity,
      hourlyRate,
      amenities: amenities || [],
      owner: req.user.id,
    });

    res.status(201).json({ success: true, room, message: 'Room added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all rooms with search & filter + pagination
// @route   GET /api/rooms
// @access  Public
const getRooms = async (req, res) => {
  try {
    const { search, amenities, minRate, maxRate, floor, page = 1, limit = 9 } = req.query;
    const filter = {};

    // Search by room name
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Filter by amenities
    if (amenities) {
      const amenityArray = amenities.split(',');
      filter.amenities = { $in: amenityArray };
    }

    // Filter by hourly rate range
    if (minRate || maxRate) {
      filter.hourlyRate = {};
      if (minRate) filter.hourlyRate.$gte = Number(minRate);
      if (maxRate) filter.hourlyRate.$lte = Number(maxRate);
    }

    // Filter by floor
    if (floor) {
      filter.floor = { $regex: floor, $options: 'i' };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(50, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const totalRooms = await Room.countDocuments(filter);
    const totalPages = Math.ceil(totalRooms / limitNum);

    const rooms = await Room.find(filter)
      .populate('owner', 'name email photoURL')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      rooms,
      totalRooms,
      totalPages,
      currentPage: pageNum,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get latest 6 rooms
// @route   GET /api/rooms/latest
// @access  Public
const getLatestRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('owner', 'name email photoURL')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single room by ID
// @route   GET /api/rooms/:id
// @access  Public
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('owner', 'name email photoURL');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get rooms by current user (my listings)
// @route   GET /api/rooms/my-listings
// @access  Private
const getMyListings = async (req, res) => {
  try {
    const rooms = await Room.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a room
// @route   PUT /api/rooms/:id
// @access  Private (owner only)
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Verify ownership
    if (room.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this room' });
    }

    const { name, description, image, floor, capacity, hourlyRate, amenities } = req.body;

    room.name = name || room.name;
    room.description = description || room.description;
    room.image = image || room.image;
    room.floor = floor || room.floor;
    room.capacity = capacity || room.capacity;
    room.hourlyRate = hourlyRate !== undefined ? hourlyRate : room.hourlyRate;
    room.amenities = amenities || room.amenities;

    const updatedRoom = await room.save();

    res.json({ success: true, room: updatedRoom, message: 'Room updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a room
// @route   DELETE /api/rooms/:id
// @access  Private (owner only)
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Verify ownership
    if (room.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this room' });
    }

    // Remove bookings associated with this room
    const bookings = await Booking.find({ room: req.params.id });
    const bookingIds = bookings.map((b) => b._id);

    // Pull booking IDs from users' bookings arrays
    if (bookingIds.length > 0) {
      const User = require('../models/User');
      await User.updateMany(
        { bookings: { $in: bookingIds } },
        { $pull: { bookings: { $in: bookingIds } } }
      );
      await Booking.deleteMany({ room: req.params.id });
    }

    await Room.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getLatestRooms,
  getRoomById,
  getMyListings,
  updateRoom,
  deleteRoom,
};
