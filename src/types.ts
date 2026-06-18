/**
 * Types & Interfaces for Agenda Fácil SaaS
 */

export interface ProfessionalProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  photoUrl?: string;
  address?: string;
  publicSlug: string; // custom public link slug
  workingSettings: WorkingSettings;
}

export interface WorkingSettings {
  intervalMinutes: number; // 15, 30, 45, 60
  workingDays: WorkingDay[];
  blockedDates: BlockedDate[];
}

export interface WorkingDay {
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  enabled: boolean;
  startTime: string; // "09:00"
  endTime: string; // "18:00"
}

export interface BlockedDate {
  id: string;
  date: string; // "YYYY-MM-DD"
  reason: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number; // in BRL/R$
  description: string;
  category: string;
  active: boolean;
}

export interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  price: number;
  duration: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  state?: string;
  city?: string;
  totalAppointments: number;
  lastAppointmentDate?: string;
}

export interface AppNotification {
  id: string;
  type: 'confirm' | 'reminder' | 'cancel';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  action: string;
  target: string;
  timestamp: string;
  details: string;
  userEmail: string;
}
