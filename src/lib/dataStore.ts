// In-Memory & LocalStorage Repository Pattern - Data Store for VacciTrack
// Persists seamlessly across page reloads, logout/login, and offline states

import { generateVaccineSchedule, generateAbhaId, ScheduledVaccine } from './vaccineSchedule';

// Type Definitions
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'parent' | 'doctor';
  hospitalName?: string;
  phone?: string;
  doctorId?: string;
}

export interface Child {
  id: string;
  parentId: string;
  name: string;
  dateOfBirth: Date | string;
  gender: 'male' | 'female';
  abhaId: string;
  doctorId?: string | { _id: string; name: string; doctorId?: string; hospitalName?: string; specialization?: string };
  schedule: ScheduledVaccine[];
  createdAt: Date | string;
}

// Pre-seeded Demo Data
const DEMO_USERS: User[] = [
  {
    id: 'user_parent_1',
    email: 'parent@demo.com',
    password: 'password123',
    name: 'Ananya Sharma',
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
    doctorId: 'DOC-A3K9X2',
  },
  {
    id: 'user_doctor_2',
    email: 'nurse@phc.com',
    password: 'password123',
    name: 'Sister Mary',
    role: 'doctor',
    hospitalName: 'Primary Health Center, Jaipur',
    doctorId: 'DOC-B7M4L9',
  },
];

// Demo child Aarav Sharma with completed birth & 6-week vaccines
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

const INITIAL_DEMO_CHILDREN: Child[] = [
  {
    id: 'child_1',
    parentId: 'user_parent_1',
    name: 'Aarav Sharma',
    dateOfBirth: aaravDob,
    gender: 'male',
    abhaId: '50040963782432',
    schedule: aaravSchedule,
    createdAt: new Date('2024-09-15'),
  },
  {
    id: 'child_2',
    parentId: 'user_parent_2',
    name: 'Ananya Kumar',
    dateOfBirth: ananyaDob,
    gender: 'female',
    abhaId: '50041234567890',
    schedule: ananyaSchedule,
    createdAt: new Date('2024-06-01'),
  },
];

const STORAGE_USERS_KEY = 'vaccitrack_db_users_v2';
const STORAGE_CHILDREN_KEY = 'vaccitrack_db_children_v2';

// Repository Classes
class UserRepository {
  private users: User[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      if (saved) {
        this.users = JSON.parse(saved);
      } else {
        this.users = [...DEMO_USERS];
        this.save();
      }
    } catch {
      this.users = [...DEMO_USERS];
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(this.users));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  findByEmail(email: string): User | undefined {
    this.load();
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findById(id: string): User | undefined {
    this.load();
    return this.users.find(u => u.id === id);
  }

  findByDoctorId(doctorId: string): User | undefined {
    this.load();
    const upper = doctorId.toUpperCase().trim();
    return this.users.find(u => u.doctorId?.toUpperCase() === upper);
  }

  create(userData: Omit<User, 'id'>): User {
    this.load();
    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    };
    this.users.push(newUser);
    this.save();
    return newUser;
  }

  authenticate(email: string, password: string): User | null {
    this.load();
    const user = this.findByEmail(email);
    if (user && user.password === password) {
      return user;
    }
    return null;
  }
}

class ChildRepository {
  private children: Child[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const saved = localStorage.getItem(STORAGE_CHILDREN_KEY);
      if (saved) {
        const parsed: any[] = JSON.parse(saved);
        this.children = parsed.map(c => ({
          ...c,
          dateOfBirth: new Date(c.dateOfBirth),
          createdAt: new Date(c.createdAt || Date.now()),
          schedule: c.schedule.map((v: any) => ({
            ...v,
            dueDate: new Date(v.dueDate),
            administeredDate: v.administeredDate ? new Date(v.administeredDate) : undefined,
          })),
        }));
      } else {
        this.children = [...INITIAL_DEMO_CHILDREN];
        this.save();
      }
    } catch {
      this.children = [...INITIAL_DEMO_CHILDREN];
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_CHILDREN_KEY, JSON.stringify(this.children));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  findAll(): Child[] {
    this.load();
    return this.children;
  }

  findById(id: string): Child | undefined {
    this.load();
    return this.children.find(c => c.id === id);
  }

  findByParentId(parentId: string): Child[] {
    this.load();
    return this.children.filter(c => c.parentId === parentId);
  }

  findByAbhaId(abhaId: string): Child | undefined {
    this.load();
    return this.children.find(c => c.abhaId === abhaId);
  }

  searchByName(query: string): Child[] {
    this.load();
    const lowerQuery = query.toLowerCase();
    return this.children.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.abhaId.includes(query)
    );
  }

  create(childData: Omit<Child, 'id' | 'abhaId' | 'schedule' | 'createdAt'>): Child {
    this.load();
    const schedule = generateVaccineSchedule(new Date(childData.dateOfBirth));
    const newChild: Child = {
      ...childData,
      id: `child_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      abhaId: generateAbhaId(),
      schedule,
      createdAt: new Date(),
    };
    this.children.push(newChild);
    this.save();
    return newChild;
  }

  update(id: string, updates: Partial<Child>): Child | undefined {
    this.load();
    const child = this.children.find(c => c.id === id);
    if (child) {
      Object.assign(child, updates);
      this.save();
    }
    return child;
  }

  remove(id: string): boolean {
    this.load();
    const initialLen = this.children.length;
    this.children = this.children.filter(c => c.id !== id);
    this.save();
    return this.children.length < initialLen;
  }

  updateVaccineStatus(
    childId: string,
    vaccineId: string,
    status: 'COMPLETED',
    administeredDate: Date = new Date()
  ): Child | undefined {
    this.load();
    const child = this.children.find(c => c.id === childId);
    if (child) {
      const vaccine = child.schedule.find(v => v.vaccineId === vaccineId);
      if (vaccine) {
        vaccine.status = status;
        vaccine.administeredDate = administeredDate;
        this.save();
      }
    }
    return child;
  }
}

// Export singleton instances
export const userRepository = new UserRepository();
export const childRepository = new ChildRepository();
