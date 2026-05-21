// Seed script to populate the database with 510 study rooms
require('dotenv').config();
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (error) {
  console.warn('Could not set DNS servers:', error.message);
}

const mongoose = require('mongoose');
const Room = require('./models/Room');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const images = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80',
  'https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=800&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80',
  'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80',
  'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
  'https://images.unsplash.com/photo-1577412647305-991150c7d163?w=800&q=80',
  'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800&q=80',
];

const roomPrefixes = [
  'Quiet Corner', 'Innovation Lab', 'Sunrise Nook', 'Graduate Pod', 'Group Hall',
  'Zen Focus', 'Media Suite', 'Rooftop Terrace', 'Silent Alcove', 'Study Den',
  'Research Bay', 'Scholar Wing', 'Academic Suite', 'Focus Chamber', 'Collab Space',
  'Think Tank', 'Learning Hub', 'Knowledge Base', 'Idea Room', 'Workshop Bay',
  'Brainstorm Lab', 'Deep Work Pod', 'Conference Nook', 'Tutorial Room', 'Exam Prep Suite',
  'Creative Studio', 'Digital Lab', 'Project Room', 'Seminar Hall', 'Reading Lounge',
];

const floors = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor', '6th Floor'];

const descriptions = [
  'A peaceful, soundproofed room with floor-to-ceiling windows overlooking the campus garden. Perfect for focused study sessions with ergonomic chairs and adjustable lighting.',
  'A modern, tech-equipped room designed for collaborative projects and group brainstorming. Features a large smartboard and comfortable seating for productive teamwork.',
  'A cozy east-facing room bathed in natural morning light. Ideal for early risers who prefer a calm environment with warm ambient lighting and lounge seating.',
  'An exclusive, climate-controlled pod reserved for intensive research work. Features dual monitor stands, high-speed ethernet, and a personal whiteboard wall.',
  'A spacious open-plan study area with moveable furniture and multiple whiteboards. Designed for larger groups, tutoring sessions, or collaborative exam preparation.',
  'A minimalist, distraction-free room with soft acoustic panels and indirect lighting. No distractions — just you and your books with a standing desk option.',
  'Fully equipped multimedia room with a large display, professional webcam, and conference audio. Ideal for remote presentations, webinars, and video conferences.',
  'An open-air study space with retractable shade canopies and panoramic campus views. A refreshing alternative to indoor spaces during pleasant weather.',
  'A strict no-talking zone designed for deep focus and exam preparation. Each desk is partitioned with frosted glass dividers for maximum privacy and concentration.',
  'A versatile study space with configurable layouts to suit solo or group study. Features built-in charging stations and natural wood finishes for a warm atmosphere.',
];

const allAmenities = ['Whiteboard', 'Projector', 'Wi-Fi', 'Power Outlets', 'Quiet Zone', 'Air Conditioning'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, min, max) => {
  const n = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');

    // Create seed user
    let seedUser = await User.findOne({ email: 'seeduser@studynook.com' });
    if (!seedUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('SeedPass123', salt);
      seedUser = await User.create({
        name: 'StudyNook Admin',
        email: 'seeduser@studynook.com',
        password: hashedPassword,
        photoURL: 'https://ui-avatars.com/api/?name=StudyNook+Admin&background=6C5CE7&color=fff&size=200',
      });
      console.log('Seed user created');
    }

    // Clear existing rooms
    await Room.deleteMany({});
    console.log('Cleared existing rooms');

    // Generate 510 rooms
    const rooms = [];
    for (let i = 1; i <= 510; i++) {
      const prefix = pick(roomPrefixes);
      const code = String.fromCharCode(65 + (i % 26)) + Math.floor(Math.random() * 99 + 1);
      rooms.push({
        name: `${prefix} ${code}`,
        description: pick(descriptions),
        image: pick(images),
        floor: pick(floors),
        capacity: Math.floor(Math.random() * 14) + 1,
        hourlyRate: Math.floor(Math.random() * 18) + 2,
        amenities: pickN(allAmenities, 2, 6),
        owner: seedUser._id,
        bookingCount: Math.floor(Math.random() * 30),
      });
    }

    // Insert in batches
    const batchSize = 100;
    for (let i = 0; i < rooms.length; i += batchSize) {
      await Room.insertMany(rooms.slice(i, i + batchSize));
      console.log(`Inserted rooms ${i + 1} – ${Math.min(i + batchSize, rooms.length)}`);
    }

    console.log(`\nSuccessfully seeded ${rooms.length} rooms!`);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedDB();
