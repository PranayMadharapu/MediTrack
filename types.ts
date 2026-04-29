export enum UserRole {
  PATIENT = 'PATIENT',
  CARETAKER = 'CARETAKER',
  DOCTOR = 'DOCTOR',
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  time: string; // HH:mm
  frequency: 'daily' | 'weekly' | 'custom';
  instructions: string;
  startDate: string;
  category: 'tablet' | 'syrup' | 'injection' | 'other';
}

export interface IntakeLog {
  id: string;
  medicineId: string;
  timestamp: string;
  status: 'taken' | 'missed' | 'delayed';
  note?: string;
}

export interface AppState {
  role: UserRole;
  medicines: Medicine[];
  logs: IntakeLog[];
}
