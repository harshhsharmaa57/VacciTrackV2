import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Child from '../models/Child.js';
import { generateVaccineSchedule } from '../utils/vaccineSchedule.js';
import { generateAbhaId } from '../utils/generateAbhaId.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Child.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create demo users
    const parent1 = await User.create({
      email: 'parent@demo.com',
      password: 'password123',
      name: 'Priya Sharma',
      role: 'parent',
      phone: '+91 98765 43210',
    });

    const parent2 = await User.create({
      email: 'parent2@demo.com',
      password: 'password123',
      name: 'Amit Kumar',
      role: 'parent',
      phone: '+91 87654 32109',
    });

    const doctor1 = await User.create({
      email: 'doctor@aiims.com',
      password: 'password123',
      name: 'Dr. Rajesh Gupta',
      role: 'doctor',
      hospitalName: 'AIIMS Delhi',
    });

    const doctor2 = await User.create({
      email: 'nurse@phc.com',
      password: 'password123',
      name: 'Sister Mary',
      role: 'doctor',
      hospitalName: 'Primary Health Center, Jaipur',
    });

    console.log('✅ Created demo users');

    // Create demo children with vaccine schedules
    const aaravDob = new Date('2024-09-15');
    const aaravSchedule = generateVaccineSchedule(aaravDob, [
      { vaccineId: 'bcg', administeredDate: new Date('2024-09-15') },
      { vaccineId: 'opv0', administeredDate: new Date('2024-09-15') },
      { vaccineId: 'hepb-birth', administeredDate: new Date('2024-09-15') },
      { vaccineId: 'opv1', administeredDate: new Date('2024-10-27') },
      { vaccineId: 'penta1', administeredDate: new Date('2024-10-27') },
      { vaccineId: 'rota1', administeredDate: new Date('2024-10-27') },
      { vaccineId: 'fipv1', administeredDate: new Date('2024-10-27') },
      { vaccineId: 'pcv1', administeredDate: new Date('2024-10-27') },
    ]);

    const ananyaDob = new Date('2024-06-01');
    const ananyaSchedule = generateVaccineSchedule(ananyaDob, [
      { vaccineId: 'bcg', administeredDate: new Date('2024-06-01') },
      { vaccineId: 'opv0', administeredDate: new Date('2024-06-01') },
      { vaccineId: 'hepb-birth', administeredDate: new Date('2024-06-01') },
      { vaccineId: 'opv1', administeredDate: new Date('2024-07-13') },
      { vaccineId: 'penta1', administeredDate: new Date('2024-07-13') },
      { vaccineId: 'rota1', administeredDate: new Date('2024-07-13') },
      { vaccineId: 'fipv1', administeredDate: new Date('2024-07-13') },
      { vaccineId: 'pcv1', administeredDate: new Date('2024-07-13') },
      { vaccineId: 'opv2', administeredDate: new Date('2024-08-10') },
      { vaccineId: 'penta2', administeredDate: new Date('2024-08-10') },
      { vaccineId: 'rota2', administeredDate: new Date('2024-08-10') },
      { vaccineId: 'opv3', administeredDate: new Date('2024-09-07') },
      { vaccineId: 'penta3', administeredDate: new Date('2024-09-07') },
      { vaccineId: 'fipv2', administeredDate: new Date('2024-09-07') },
      { vaccineId: 'rota3', administeredDate: new Date('2024-09-07') },
      { vaccineId: 'pcv2', administeredDate: new Date('2024-09-07') },
    ]);

    await Child.create({
      parentId: parent1._id,
      name: 'Aarav Sharma',
      dateOfBirth: aaravDob,
      gender: 'male',
      abhaId: generateAbhaId(),
      schedule: aaravSchedule,
    });

    await Child.create({
      parentId: parent2._id,
      name: 'Ananya Kumar',
      dateOfBirth: ananyaDob,
      gender: 'female',
      abhaId: generateAbhaId(),
      schedule: ananyaSchedule,
    });

    console.log('✅ Created demo children with vaccination schedules');
    console.log('\n📊 Database seeded successfully!');
    console.log('\n🔑 Demo Credentials:');
    console.log('Parent: parent@demo.com / password123');
    console.log('Doctor: doctor@aiims.com / password123');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();


