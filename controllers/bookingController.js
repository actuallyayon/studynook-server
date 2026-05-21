const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const { roomId, date, startTime, endTime, specialNote } = req.body;

    // Validate room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Validate times
    if (endTime <= startTime) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    // Check for booking conflicts using $gte and $lte
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    const conflict = await Booking.findOne({
      room: roomId,
      date: bookingDate,
      status: 'confirmed',
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please choose a different time.',
      });
    }

    // Calculate total cost
    const totalCost = (endTime - startTime) * room.hourlyRate;

    // Create booking
    const booking = await Booking.create({
      room: roomId,
      user: req.user.id,
      date: bookingDate,
      startTime,
      endTime,
      totalCost,
      specialNote: specialNote || '',
    });

    // $push booking ID into user's bookings array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { bookings: booking._id },
    });

    // $inc room's bookingCount
    await Room.findByIdAndUpdate(roomId, {
      $inc: { bookingCount: 1 },
    });

    res.status(201).json({
      success: true,
      booking,
      message: 'Room booked successfully!',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('room', 'name image hourlyRate floor capacity')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify the booking belongs to the user
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    // Update status
    booking.status = 'cancelled';
    await booking.save();

    // $pull booking ID from user's bookings array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { bookings: booking._id },
    });

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createBooking, getMyBookings, cancelBooking };
