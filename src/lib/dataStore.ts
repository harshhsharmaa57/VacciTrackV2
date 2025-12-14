// In-Memory Repository Pattern - Data Store for VacciTrack
// This simulates a database using arrays for hackathon demo purposes

import { generateVaccineSchedule, generateAbhaId, ScheduledVaccine } from './vaccineSchedule';

// Type Definitions
export interface User {
  id: string;
  email: string;
  password: string; // In real app, this would be hashed
  name: string;
  role: 'parent' | 'doctor';
  hospitalName?: string;
  phone?: string;
}

export interface Child {
  id: string;
  parentId: string;
  name: string;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  abhaId: string;
  schedule: ScheduledVaccine[];
  createdAt: Date;
}

// Pre-seeded Demo Data
const DEMO_USERS: User[] = [
  {
    id: 'user_parent_1',
    email: 'parent@demo.com',
    password: 'password123',
    name: 'Priya Sharma',
    role: 'parent',
    phone: '+91 98765 43210',
  },
  {
    id: 'user_parent_2',
    email: 'parent2@demo.com',
    password: 'password123',
    name: 'Amit Kumar',
    role: 'parent',
    phone: '+91 87654 32109',
  },
  {
    id: 'user_doctor_1',
    email: 'doctor@aiims.com',
    password: 'password123',
    name: 'Dr. Rajesh Gupta',
    role: 'doctor',
    hospitalName: 'AIIMS Delhi',
  },
  {
    id: 'user_doctor_2',
    email: 'nurse@phc.com',
    password: 'password123',
    name: 'Sister Mary',
    role: 'doctor',
    hospitalName: 'Primary Health Center, Jaipur',
  },
];

// Demo child with some completed vaccines
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

const DEMO_CHILDREN: Child[] = [
  {
    id: 'child_1',
    parentId: 'user_parent_1',
    name: 'Aarav Sharma',
    dateOfBirth: aaravDob,
    gender: 'male',
    abhaId: generateAbhaId(),
    schedule: aaravSchedule,
    createdAt: new Date('2024-09-15'),
  },
  {
    id: 'child_2',
    parentId: 'user_parent_2',
    name: 'Ananya Kumar',
    dateOfBirth: ananyaDob,
    gender: 'female',
    abhaId: generateAbhaId(),
    schedule: ananyaSchedule,
    createdAt: new Date('2024-06-01'),
  },
];

// Repository Classes
class UserRepository {
  private users: User[] = [...DEMO_USERS];
  private currentId = 3;

  findByEmail(email: string): User | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  create(userData: Omit<User, 'id'>): User {
    const newUser: User = {
      ...userData,
      id: `user_${this.currentId++}`,
    };
    this.users.push(newUser);
    return newUser;
  }

  authenticate(email: string, password: string): User | null {
    const user = this.findByEmail(email);
    if (user && user.password === password) {
      return user;
    }
    return null;
  }
}

class ChildRepository {
  private children: Child[] = [...DEMO_CHILDREN];
  private currentId = 3;

  findAll(): Child[] {
    return this.children;
  }

  findById(id: string): Child | undefined {
    return this.children.find(c => c.id === id);
  }

  findByParentId(parentId: string): Child[] {
    return this.children.filter(c => c.parentId === parentId);
  }

  findByAbhaId(abhaId: string): Child | undefined {
    return this.children.find(c => c.abhaId === abhaId);
  }

  searchByName(query: string): Child[] {
    const lowerQuery = query.toLowerCase();
    return this.children.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.abhaId.includes(query)
    );
  }

  create(childData: Omit<Child, 'id' | 'abhaId' | 'schedule' | 'createdAt'>): Child {
    const schedule = generateVaccineSchedule(childData.dateOfBirth);
    const newChild: Child = {
      ...childData,
      id: `child_${this.currentId++}`,
      abhaId: generateAbhaId(),
      schedule,
      createdAt: new Date(),
    };
    this.children.push(newChild);
    return newChild;
  }

  updateVaccineStatus(
    childId: string,
    vaccineId: string,
    status: 'COMPLETED',
    administeredDate: Date = new Date()
  ): Child | undefined {
    const child = this.findById(childId);
    if (child) {
      const vaccine = child.schedule.find(v => v.vaccineId === vaccineId);
      if (vaccine) {
        vaccine.status = status;
        vaccine.administeredDate = administeredDate;
      }
    }
    return child;
  }
}

// Export singleton instances
export const userRepository = new UserRepository();
export const childRepository = new ChildRepository();

// Utility to reset data (for testing)
export const resetDemoData = () => {
  // Re-initialize repositories would go here
  console.log('Demo data reset');
};
