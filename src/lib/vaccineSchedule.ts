// VaxCalc Engine - National Immunization Schedule (NIS) 2025 Logic
import { addWeeks, addMonths, addYears, differenceInDays, isBefore, isAfter, format } from 'date-fns';

export interface VaccineDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  ageWeeks?: number;
  ageMonths?: number;
  ageYears?: number;
  series?: string;
  doseNumber?: number;
  minIntervalDays?: number;
  gracePeriodDays: number;
  type: 'primary' | 'booster';
  phase: 1 | 2 | 3 | 4;
}

export interface ScheduledVaccine {
  vaccineId: string;
  name: string;
  shortName: string;
  description: string;
  dueDate: Date;
  administeredDate?: Date;
  status: 'COMPLETED' | 'PENDING' | 'OVERDUE' | 'UPCOMING';
  phase: number;
  doseNumber?: number;
  series?: string;
}

// Master NIS 2025 Schedule
export const MASTER_VACCINE_SCHEDULE: VaccineDefinition[] = [
  // Phase 1: Birth Window (0-15 Days)
  {
    id: 'bcg',
    name: 'BCG (Bacillus Calmette-Guérin)',
    shortName: 'BCG',
    description: 'Protection against Tuberculosis',
    ageWeeks: 0,
    gracePeriodDays: 14,
    type: 'primary',
    phase: 1,
  },
  {
    id: 'opv0',
    name: 'Oral Polio Vaccine - Zero Dose',
    shortName: 'OPV-0',
    description: 'First oral polio dose at birth',
    ageWeeks: 0,
    gracePeriodDays: 14,
    type: 'primary',
    phase: 1,
  },
  {
    id: 'hepb-birth',
    name: 'Hepatitis B - Birth Dose',
    shortName: 'Hep-B BD',
    description: 'Must be given within 24 hours of birth',
    ageWeeks: 0,
    gracePeriodDays: 1,
    type: 'primary',
    phase: 1,
  },
  
  // Phase 2: Primary Series (6, 10, 14 Weeks)
  // 6 Weeks
  {
    id: 'opv1',
    name: 'Oral Polio Vaccine - Dose 1',
    shortName: 'OPV-1',
    description: 'First primary polio dose',
    ageWeeks: 6,
    series: 'OPV',
    doseNumber: 1,
    gracePeriodDays: 28,
    type: 'primary',
    phase: 2,
  },
  {
    id: 'penta1',
    name: 'Pentavalent - Dose 1',
    shortName: 'Penta-1',
    description: 'DPT + Hep-B + Hib combination vaccine',
    ageWeeks: 6,
    series: 'Pentavalent',
    doseNumber: 1,
    gracePeriodDays: 28,
    type: 'primary',
    phase: 2,
  },
  {
    id: 'rota1',
    name: 'Rotavirus - Dose 1',
    shortName: 'Rota-1',
    description: 'Protection against Rotavirus diarrhea',
    ageWeeks: 6,
    series: 'Rotavirus',
    doseNumber: 1,
    gracePeriodDays: 28,
    type: 'primary',
    phase: 2,
  },
  {
    id: 'fipv1',
    name: 'Fractional IPV - Dose 1',
    shortName: 'fIPV-1',
    description: 'Inactivated Polio Vaccine',
    ageWeeks: 6,
    series: 'fIPV',
    doseNumber: 1,
    gracePeriodDays: 28,
    type: 'primary',
    phase: 2,
  },
  {
    id: 'pcv1',
    name: 'Pneumococcal - Dose 1',
    shortName: 'PCV-1',
    description: 'Protection against Pneumonia',
    ageWeeks: 6,
    series: 'PCV',
    doseNumber: 1,
    gracePeriodDays: 28,
    type: 'primary',
    phase: 2,
  },
  
  // 10 Weeks
  {
    id: 'opv2',
    name: 'Oral Polio Vaccine - Dose 2',
    shortName: 'OPV-2',
    description: 'Second primary polio dose',
    ageWeeks: 10,
    series: 'OPV',
    doseNumber: 2,
    minIntervalDays: 28,
    gracePeriodDays: 28,
    type: 'primary',
    phase: 2,
  },
  {
    id: 'penta2',
    name: 'Pentavalent - Dose 2',
    shortName: 'Penta-2',
    description: 'DPT + Hep-B + Hib combination vaccine',
    ageWeeks: 10,
    series: 'Pentavalent',
    doseNumber: 2,
    minIntervalDays: 28,
    gracePeriodDays: 28,
    type: 'primary',
    phase: 2,
  },
  {
    id: 'rota2',
    name: 'Rotavirus - Dose 2',
    shortName: 'Rota-2',
    description: 'Protection against Rotavirus diarrhea',
    ageWeeks: 10,
    series: 'Rotavirus',
    doseNumber: 2,
    minIntervalDays: 28,
    gracePeriodDays: 28,
    type: 'primary',
    phase: 2,
  },
  
  // 14 Weeks
  {
    id: 'opv3',
    name: 'Oral Polio Vaccine - Dose 3',
    shortName: 'OPV-3',
    description: 'Third primary polio dose',
    ageWeeks: 14,
    series: 'OPV',
    doseNumber: 3,
    minIntervalDays: 28,
    gracePeriodDays: 28,
    type: 'primary',
    phase: 2,
  },
  {
    id: 'penta3',
    name: 'Pentavalent - Dose 3',
    shortName: 'Penta-3',
    description: 'DPT + Hep-B + Hib combination vaccine',
    ageWeeks: 14,
    series: 'Pentavalent',
    doseNumber: 3,
    minIntervalDays: 28,
    gracePeriodDays: 28,
    type: 'primary',
    phase: 2,
  },
  {
    id: 'fipv2',
    name: 'Fractional IPV - Dose 2',
    shortName: 'fIPV-2',
    description: 'Inactivated Polio Vaccine',
    ageWeeks: 14,
    series: 'fIPV',
    doseNumber: 2,
    minIntervalDays: 56,
    gracePeriodDays: 28,
    type: 'primary',
    phase: 2,
  },
  {
    id: 'rota3',
    name: 'Rotavirus - Dose 3',
    shortName: 'Rota-3',
    description: 'Protection against Rotavirus diarrhea',
    ageWeeks: 14,
    series: 'Rotavirus',
    doseNumber: 3,
    minIntervalDays: 28,
    gracePeriodDays: 28,
    type: 'primary',
    phase: 2,
  },
  {
    id: 'pcv2',
    name: 'Pneumococcal - Dose 2',
    shortName: 'PCV-2',
    description: 'Protection against Pneumonia',
    ageWeeks: 14,
    series: 'PCV',
    doseNumber: 2,
    minIntervalDays: 28,
    gracePeriodDays: 28,
    type: 'primary',
    phase: 2,
  },
  
  // Phase 3: 9 Months - 2 Years
  {
    id: 'mr1',
    name: 'Measles & Rubella - Dose 1',
    shortName: 'MR-1',
    description: 'Protection against Measles and Rubella',
    ageMonths: 9,
    series: 'MR',
    doseNumber: 1,
    gracePeriodDays: 90,
    type: 'primary',
    phase: 3,
  },
  {
    id: 'je1',
    name: 'Japanese Encephalitis - Dose 1',
    shortName: 'JE-1',
    description: 'Endemic districts only',
    ageMonths: 9,
    series: 'JE',
    doseNumber: 1,
    gracePeriodDays: 90,
    type: 'primary',
    phase: 3,
  },
  {
    id: 'pcv-booster',
    name: 'Pneumococcal Booster',
    shortName: 'PCV-B',
    description: 'Booster dose for Pneumonia protection',
    ageMonths: 9,
    series: 'PCV',
    doseNumber: 3,
    gracePeriodDays: 90,
    type: 'booster',
    phase: 3,
  },
  {
    id: 'mr2',
    name: 'Measles & Rubella - Dose 2',
    shortName: 'MR-2',
    description: 'Second dose for stronger immunity',
    ageMonths: 16,
    series: 'MR',
    doseNumber: 2,
    minIntervalDays: 180,
    gracePeriodDays: 180,
    type: 'booster',
    phase: 3,
  },
  {
    id: 'je2',
    name: 'Japanese Encephalitis - Dose 2',
    shortName: 'JE-2',
    description: 'Endemic districts only',
    ageMonths: 16,
    series: 'JE',
    doseNumber: 2,
    minIntervalDays: 180,
    gracePeriodDays: 180,
    type: 'booster',
    phase: 3,
  },
  {
    id: 'dpt-booster1',
    name: 'DPT Booster - Dose 1',
    shortName: 'DPT-B1',
    description: 'Diphtheria, Pertussis, Tetanus booster',
    ageMonths: 16,
    gracePeriodDays: 180,
    type: 'booster',
    phase: 3,
  },
  {
    id: 'opv-booster',
    name: 'OPV Booster',
    shortName: 'OPV-B',
    description: 'Oral Polio Vaccine booster',
    ageMonths: 16,
    gracePeriodDays: 180,
    type: 'booster',
    phase: 3,
  },
  
  // Phase 4: 5-16 Years
  {
    id: 'dpt-booster2',
    name: 'DPT Booster - Dose 2',
    shortName: 'DPT-B2',
    description: 'School entry booster',
    ageYears: 5,
    gracePeriodDays: 365,
    type: 'booster',
    phase: 4,
  },
  {
    id: 'td-10',
    name: 'Tetanus & Adult Diphtheria',
    shortName: 'Td-10',
    description: 'Given at 10 years of age',
    ageYears: 10,
    gracePeriodDays: 365,
    type: 'booster',
    phase: 4,
  },
  {
    id: 'td-16',
    name: 'Tetanus & Adult Diphtheria',
    shortName: 'Td-16',
    description: 'Given at 16 years of age',
    ageYears: 16,
    gracePeriodDays: 365,
    type: 'booster',
    phase: 4,
  },
];

// Calculate due date from DOB
export const calculateDueDate = (dob: Date, vaccine: VaccineDefinition): Date => {
  let dueDate = new Date(dob);
  
  if (vaccine.ageWeeks !== undefined) {
    dueDate = addWeeks(dob, vaccine.ageWeeks);
  } else if (vaccine.ageMonths !== undefined) {
    dueDate = addMonths(dob, vaccine.ageMonths);
  } else if (vaccine.ageYears !== undefined) {
    dueDate = addYears(dob, vaccine.ageYears);
  }
  
  return dueDate;
};

// Determine vaccine status
export const getVaccineStatus = (
  dueDate: Date,
  administeredDate: Date | undefined,
  gracePeriodDays: number
): 'COMPLETED' | 'PENDING' | 'OVERDUE' | 'UPCOMING' => {
  if (administeredDate) {
    return 'COMPLETED';
  }
  
  const today = new Date();
  const daysDiff = differenceInDays(dueDate, today);
  
  if (daysDiff > 7) {
    return 'UPCOMING';
  } else if (daysDiff >= -gracePeriodDays) {
    return 'PENDING';
  } else {
    return 'OVERDUE';
  }
};

// Generate full schedule for a child
export const generateVaccineSchedule = (
  dob: Date,
  completedVaccines: { vaccineId: string; administeredDate: Date }[] = []
): ScheduledVaccine[] => {
  const completedMap = new Map(
    completedVaccines.map(v => [v.vaccineId, v.administeredDate])
  );
  
  return MASTER_VACCINE_SCHEDULE.map(vaccine => {
    const dueDate = calculateDueDate(dob, vaccine);
    const administeredDate = completedMap.get(vaccine.id);
    const status = getVaccineStatus(dueDate, administeredDate, vaccine.gracePeriodDays);
    
    return {
      vaccineId: vaccine.id,
      name: vaccine.name,
      shortName: vaccine.shortName,
      description: vaccine.description,
      dueDate,
      administeredDate,
      status,
      phase: vaccine.phase,
      doseNumber: vaccine.doseNumber,
      series: vaccine.series,
    };
  });
};

// Get upcoming vaccines (due within 30 days)
export const getUpcomingVaccines = (schedule: ScheduledVaccine[]): ScheduledVaccine[] => {
  const today = new Date();
  return schedule.filter(v => {
    if (v.status === 'COMPLETED') return false;
    const daysDiff = differenceInDays(v.dueDate, today);
    return daysDiff >= 0 && daysDiff <= 30;
  });
};

// Get overdue vaccines
export const getOverdueVaccines = (schedule: ScheduledVaccine[]): ScheduledVaccine[] => {
  return schedule.filter(v => v.status === 'OVERDUE');
};

// Calculate shield level based on completed vaccines
export const calculateShieldLevel = (completedCount: number): { level: number; title: string; progress: number } => {
  const totalVaccines = MASTER_VACCINE_SCHEDULE.length;
  const progress = (completedCount / totalVaccines) * 100;
  
  if (completedCount === 0) {
    return { level: 0, title: 'Not Started', progress: 0 };
  } else if (completedCount <= 3) {
    return { level: 1, title: 'Shield Initiated', progress };
  } else if (completedCount <= 8) {
    return { level: 2, title: 'Growing Stronger', progress };
  } else if (completedCount <= 15) {
    return { level: 3, title: 'Well Protected', progress };
  } else if (completedCount <= 20) {
    return { level: 4, title: 'Super Protected', progress };
  } else {
    return { level: 5, title: 'Immunity Champion', progress };
  }
};

// Format age display
export const getAgeDisplay = (vaccine: VaccineDefinition): string => {
  if (vaccine.ageWeeks !== undefined) {
    if (vaccine.ageWeeks === 0) return 'At Birth';
    return `${vaccine.ageWeeks} weeks`;
  }
  if (vaccine.ageMonths !== undefined) {
    return `${vaccine.ageMonths} months`;
  }
  if (vaccine.ageYears !== undefined) {
    return `${vaccine.ageYears} years`;
  }
  return '';
};

// Generate ABHA ID (14-digit simulated)
export const generateAbhaId = (): string => {
  return Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join('');
};
