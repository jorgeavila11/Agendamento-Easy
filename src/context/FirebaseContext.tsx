import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  getDocFromServer,
  getDocs 
} from 'firebase/firestore';
import { 
  ProfessionalProfile, 
  Service, 
  Appointment, 
  Customer, 
  AppNotification, 
  WorkingSettings,
  AuditLog
} from '../types';
import { sendWhatsAppConfirmation } from '../utils/whatsapp';
import { encryptText, decryptText } from '../utils/crypto';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, shouldThrow: boolean = false) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}

// Helper sanitizers to strictly enforce firestore.rules schemas and keys
function sanitizeUser(user: any, uid: string): any {
  return {
    uid,
    name: user.name || "Profissional",
    email: user.email || "",
    phone: user.phone || "",
    description: user.description || "",
    photoUrl: user.photoUrl || "",
    bannerUrl: user.bannerUrl || "",
    address: user.address || "",
    publicSlug: user.publicSlug || `pro-${uid.slice(0, 6)}`,
    whatsappPhoneNumberId: user.whatsappPhoneNumberId || "",
    whatsappToken: user.whatsappToken || ""
  };
}

function sanitizeService(srv: any): any {
  return {
    id: srv.id,
    name: srv.name,
    duration: parseInt(srv.duration as any, 10) || 30,
    price: parseFloat(srv.price as any) || 0,
    category: srv.category || "Geral",
    description: srv.description || "",
    active: srv.active !== false
  };
}

function sanitizeSchedule(sched: any): any {
  return {
    intervalMinutes: parseInt(sched.intervalMinutes as any, 10) || 30,
    workingDays: (sched.workingDays || []).map((w: any) => ({
      dayOfWeek: parseInt(w.dayOfWeek as any, 10),
      enabled: w.enabled !== false,
      startTime: w.startTime || "09:00",
      endTime: w.endTime || "18:00"
    })),
    blockedDates: (sched.blockedDates || []).map((b: any) => ({
      id: b.id || `b_${Date.now()}_${Math.random()}`,
      date: b.date || "",
      reason: b.reason || ""
    }))
  };
}

function sanitizeAppointment(app: any): any {
  return {
    id: app.id,
    serviceId: app.serviceId,
    serviceName: app.serviceName,
    price: parseFloat(app.price as any) || 0,
    duration: parseInt(app.duration as any, 10) || 30,
    customerName: app.customerName,
    customerPhone: app.customerPhone,
    customerEmail: app.customerEmail || "",
    date: app.date,
    time: app.time,
    status: app.status || "pending",
    notes: app.notes || "",
    createdAt: app.createdAt || new Date().toISOString()
  };
}

function sanitizeCustomer(cust: any): any {
  return {
    id: cust.id,
    name: cust.name,
    phone: cust.phone,
    email: cust.email || "",
    state: cust.state || "",
    city: cust.city || "",
    totalAppointments: parseInt(cust.totalAppointments as any, 10) || 0,
    lastAppointmentDate: cust.lastAppointmentDate || ""
  };
}

interface FirebaseContextType {
  user: FirebaseUser | null;
  isDemoLoggedIn: boolean;
  setIsDemoLoggedIn: (val: boolean) => void;
  profile: ProfessionalProfile;
  services: Service[];
  appointments: Appointment[];
  customers: Customer[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  isFirebaseConnected: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, phone: string, category: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateProfile: (updates: Partial<ProfessionalProfile>) => void;
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addCustomer: (cust: Omit<Customer, 'id' | 'totalAppointments' | 'lastAppointmentDate'>) => Promise<void>;
  createAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Promise<Appointment | string>;
  updateAppointmentStatus: (id: string, status: 'pending' | 'confirmed' | 'cancelled') => void;
  updateWorkingSettings: (settings: WorkingSettings) => void;
  clearNotifications: () => void;
  markNotificationRead: (id: string) => void;
  addAuditLog: (action: string, target: string, details: string) => Promise<void>;
  sessionClient: Customer | null;
  setSessionClient: (client: Customer | null) => void;
  fetchCustomerAndSync: (phone: string) => Promise<Customer | null>;
  fetchAppointmentsAndSync: (phone: string) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

// Initial professional profile (Juliana Costa template)
const DEFAULT_PROFILE: ProfessionalProfile = {
  uid: 'prof_essence_123',
  name: 'Juliana Costa',
  email: 'contato@studioessence.com',
  phone: '(11) 98765-4321',
  description: 'Especialista em bem-estar e estética corporal. Oferecemos experiências exclusivas de corte, coloração, manicure e tratamentos estéticos premium.',
  address: 'Rua das Flores, 450 - Jardins, São Paulo - SP',
  publicSlug: 'studio-essence',
  photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmZAx-iTYeZTlu08pJIRDHgulDQ22Qkc-s0S9JMPEOm6N4zpBH2_R3G0CCpoVuHEkIEVB6_JnYEaNroWwguF15kkvfZ40cRXvqGoarUDXAoXCTIYoQwNJlY8iM5DYwYTjezUSqS33XBmUAXP0W2rTsfzBXDb_pKOMdgj4iObs_LQWGEBlogUJGKsNKX-Lw6jozozCz8U2awlIX9ghHDqNwu1Zuz-UtwwcvIjZeAI9B9kIA3qUP5ELwvPLTYraNsPDXllQK9dU-7w',
  bannerUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaKtwsm7_GInilEPbn0Q8kO8vGPTPmD_l53662ZzXTdMA_Tn8p9JlG-vMu62oyZ4C1f4Uojl-UAh3AebF7e41h9LlrnSGn0P5du0NxtBr5Cyiy2hbNoBdZGFxS7IDQuODZElyYBADDo2WV_XJZ2UXqH5z1cYxKArF2ki2mZJFeo1HQvngVwsbakFGJI0eWZ4rCW53WgPBdhfyzJiTP3DDNQRCmScMbSrCzanfewfbjdspg3K-ep3pf-mvTgtL1MuK5pnpppBX4Ww',
  whatsappPhoneNumberId: '911523022053417',
  whatsappToken: '',
  workingSettings: {
    intervalMinutes: 30,
    workingDays: [
      { dayOfWeek: 1, enabled: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 2, enabled: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 3, enabled: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 4, enabled: true, startTime: '09:00', endTime: '18:00' },
      { dayOfWeek: 5, enabled: true, startTime: '09:00', endTime: '20:00' },
      { dayOfWeek: 6, enabled: true, startTime: '09:00', endTime: '16:00' },
      { dayOfWeek: 0, enabled: false, startTime: '09:00', endTime: '18:00' },
    ],
    blockedDates: [
      { id: 'b1', date: '2026-06-25', reason: 'Feriado Municipal' }
    ]
  }
};

const DEFAULT_SERVICES: Service[] = [
  {
    id: 'srv_1',
    name: 'Corte Masculino Premium',
    duration: 45,
    price: 85,
    description: 'Corte personalizado moderno acompanhado de lavagem refrescante e massagem capilar.',
    category: 'Cabelo',
    active: true
  },
  {
    id: 'srv_2',
    name: 'Design de Sobrancelha',
    duration: 30,
    price: 120,
    description: 'Mapeamento facial para design harmonioso e aplicação de henna opcional de alta qualidade.',
    category: 'Estética',
    active: true
  },
  {
    id: 'srv_3',
    name: 'Coloração e Hidratação',
    duration: 120,
    price: 250,
    description: 'Transformação de cor completa utilizando produtos orgânicos importados livre de amônia, finalizado com tratamento reconstrutor.',
    category: 'Cabelo',
    active: true
  },
  {
    id: 'srv_4',
    name: 'Manicure Completa',
    duration: 60,
    price: 65,
    description: 'Cutilagem russa, hidratação profunda e esmaltação premium de longa duração.',
    category: 'Unhas',
    active: true
  }
];

const DEFAULT_APPOINTMENTS: Appointment[] = [
  {
    id: 'app_1',
    serviceId: 'srv_1',
    serviceName: 'Corte Masculino Premium',
    price: 85,
    duration: 45,
    customerName: 'Sarah Jenkins',
    customerPhone: '(11) 99111-2222',
    customerEmail: 'sarah.jenkins@gmail.com',
    date: '2026-07-09',
    time: '09:00',
    status: 'confirmed',
    notes: 'Solicitou corte degradê bem baixo',
    createdAt: '2026-07-08T14:30:00Z'
  },
  {
    id: 'app_2',
    serviceId: 'srv_3',
    serviceName: 'Coloração e Hidratação',
    price: 250,
    duration: 120,
    customerName: 'Mariana Silva',
    customerPhone: '(11) 99222-3333',
    customerEmail: 'mariana.silva@hotmail.com',
    date: '2026-07-09',
    time: '14:00',
    status: 'confirmed',
    notes: 'Trazer imagem de referência de cor loira perolada',
    createdAt: '2026-07-07T10:15:00Z'
  },
  {
    id: 'app_3',
    serviceId: 'srv_2',
    serviceName: 'Design de Sobrancelha',
    price: 120,
    duration: 30,
    customerName: 'Mike Ross',
    customerPhone: '(11) 99333-4444',
    customerEmail: 'mike.ross@pearson.com',
    date: '2026-07-10',
    time: '10:15',
    status: 'pending',
    notes: 'Agendou pelo link público',
    createdAt: '2026-07-09T08:00:00Z'
  },
  {
    id: 'app_4',
    serviceId: 'srv_4',
    serviceName: 'Manicure Completa',
    price: 65,
    duration: 60,
    customerName: 'Emma Wilson',
    customerPhone: '(11) 99444-5555',
    customerEmail: 'emma.wilson@techcorp.com',
    date: '2026-07-10',
    time: '11:00',
    status: 'pending',
    createdAt: '2026-07-09T09:12:00Z'
  }
];

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust_991112222',
    name: 'Sarah Jenkins',
    phone: '(11) 99111-2222',
    email: 'sarah.jenkins@gmail.com',
    totalAppointments: 3,
    lastAppointmentDate: '2026-07-09 09:00'
  },
  {
    id: 'cust_992223333',
    name: 'Mariana Silva',
    phone: '(11) 99222-3333',
    email: 'mariana.silva@hotmail.com',
    totalAppointments: 5,
    lastAppointmentDate: '2026-07-09 14:00'
  },
  {
    id: 'cust_993334444',
    name: 'Mike Ross',
    phone: '(11) 99333-4444',
    email: 'mike.ross@pearson.com',
    totalAppointments: 1,
    lastAppointmentDate: '2026-07-10 10:15'
  },
  {
    id: 'cust_994445555',
    name: 'Emma Wilson',
    phone: '(11) 99444-5555',
    email: 'emma.wilson@techcorp.com',
    totalAppointments: 2,
    lastAppointmentDate: '2026-07-10 11:00'
  }
];

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'not_1',
    type: 'confirm',
    title: 'Novo agendamento efetuado!',
    message: 'Sarah Jenkins agendou Corte Masculino Premium para quinta-feira, 09 de Julho às 09:00.',
    read: false,
    timestamp: '2026-07-08T14:30:00Z'
  },
  {
    id: 'not_2',
    type: 'confirm',
    title: 'Novo pedido pendente',
    message: 'Mike Ross solicitou Design de Sobrancelha para sexta-feira, 10 de Julho às 10:15.',
    read: false,
    timestamp: '2026-07-09T08:00:00Z'
  }
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_abc1',
    action: 'Criação de Conta',
    target: 'Perfil de usuário',
    timestamp: '2026-06-15T12:00:00Z',
    details: 'Perfil de Juliana Costa inicializado no banco de dados',
    userEmail: 'jorgeavilamiranda11@gmail.com'
  },
  {
    id: 'log_abc2',
    action: 'Cadastro de Serviço',
    target: 'srv_1 (Corte Masculino Premium)',
    timestamp: '2026-06-15T12:05:00Z',
    details: 'Serviço srv_1 registrado pelo usuário Juliana Costa com preço R$ 85,00',
    userEmail: 'jorgeavilamiranda11@gmail.com'
  },
  {
    id: 'log_abc3',
    action: 'Atualização de Horários',
    target: 'Configuração Agenda',
    timestamp: '2026-06-16T08:15:00Z',
    details: 'Horário de funcionamento salvo com sucesso. Intervalos de 30 minutos.',
    userEmail: 'jorgeavilamiranda11@gmail.com'
  }
];

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isDemoLoggedIn, setIsDemoLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('af_is_demo_logged_in') === 'true';
  });
  
  useEffect(() => {
    localStorage.setItem('af_is_demo_logged_in', isDemoLoggedIn ? 'true' : 'false');
  }, [isDemoLoggedIn]);

  const [profile, setProfile] = useState<ProfessionalProfile>(() => {
    const saved = localStorage.getItem('af_profile');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('af_services');
    return saved ? JSON.parse(saved) : DEFAULT_SERVICES;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('af_appointments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Appointment[];
        if (Array.isArray(parsed)) {
          // Auto-migrate: If cached appointments are only from June 2026, clear and reset to July 2026 defaults
          const hasJuneOnly = parsed.length > 0 && parsed.every(item => item.date && item.date.startsWith('2026-06-'));
          if (hasJuneOnly) {
            localStorage.removeItem('af_appointments');
            localStorage.removeItem('af_customers');
            localStorage.removeItem('af_notifications');
            return DEFAULT_APPOINTMENTS;
          }
          const seen = new Set<string>();
          return parsed.filter(item => {
            if (!item || !item.id) return false;
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
        }
      } catch (e) {
        console.error("Failed to parse appointments:", e);
      }
    }
    return DEFAULT_APPOINTMENTS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('af_customers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Customer[];
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          return parsed.filter(item => {
            if (!item || !item.id) return false;
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
        }
      } catch (e) {
        console.error("Failed to parse customers:", e);
      }
    }
    return DEFAULT_CUSTOMERS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('af_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AppNotification[];
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          return parsed.filter(item => {
            if (!item || !item.id) return false;
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
        }
      } catch (e) {
        console.error("Failed to parse notifications:", e);
      }
    }
    return DEFAULT_NOTIFICATIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('af_audit_logs');
    return saved ? JSON.parse(saved) : DEFAULT_AUDIT_LOGS;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);

  const [sessionClient, setSessionClientState] = useState<Customer | null>(() => {
    const saved = localStorage.getItem('af_session_client');
    return saved ? JSON.parse(saved) : null;
  });

  const setSessionClient = (client: Customer | null) => {
    setSessionClientState(client);
    if (client) {
      localStorage.setItem('af_session_client', JSON.stringify(client));
    } else {
      localStorage.removeItem('af_session_client');
    }
  };

  // Sync state to local storage as fallback and cache
  useEffect(() => {
    localStorage.setItem('af_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('af_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('af_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('af_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('af_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('af_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Check connection to Firestore (CRITICAL CONSTRAINT)
  useEffect(() => {
    async function checkConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        setIsFirebaseConnected(true);
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. Server is offline.");
          setIsFirebaseConnected(false);
        } else {
          // A permission denied error means we ARE connected, but blocked (which is expected for /test/connection)
          setIsFirebaseConnected(true);
        }
      }
    }
    checkConnection();
  }, []);

  // Handle Firebase active Auth listeners and real-time syncing
  useEffect(() => {
    let activeUnsubscribers: (() => void)[] = [];

    const clearActiveListeners = () => {
      activeUnsubscribers.forEach((unsub) => {
        try {
          unsub();
        } catch (e) {
          console.error("Error unsubscribing listener:", e);
        }
      });
      activeUnsubscribers = [];
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      // Always clear previous listeners on auth state change (whether logging in or out)
      clearActiveListeners();

      if (!firebaseUser) {
        setIsLoading(true);
        try {
          console.log("FirebaseContext: Starting public professional profile fetch");
          let usersSnap: any = null;
          try {
            usersSnap = await getDocs(collection(db, 'users'));
            console.log("FirebaseContext: successfully fetched users collection, empty:", usersSnap.empty);
          } catch (usersErr: any) {
            console.error("FirebaseContext: Critical error listing 'users' collection:", usersErr.message, usersErr);
          }

          let userId = 'prof_essence_123';
          let userData: any = null;

          if (usersSnap && !usersSnap.empty) {
            // Find the first professional user profile that is not the default test one, if other exists
            let mainUserDoc = usersSnap.docs[0];
            for (const docObj of usersSnap.docs) {
              if (docObj.id !== 'prof_essence_123') {
                mainUserDoc = docObj;
                break;
              }
            }
            userId = mainUserDoc.id;
            userData = mainUserDoc.data();
          } else {
            // If empty or failed, look up prof_essence_123 specifically
            try {
              const fallbackDoc = await getDoc(doc(db, 'users', 'prof_essence_123'));
              if (fallbackDoc.exists()) {
                userId = 'prof_essence_123';
                userData = fallbackDoc.data();
              }
            } catch (fallbackErr: any) {
              console.error("FirebaseContext: Error fetching fallback user doc:", fallbackErr.message, fallbackErr);
            }
          }

          console.log("FirebaseContext: Located professional user profile:", userId);

          if (userData) {
            setProfile(prev => ({
              ...prev,
              uid: userId,
              name: userData.name || DEFAULT_PROFILE.name,
              email: userData.email || DEFAULT_PROFILE.email,
              phone: userData.phone || DEFAULT_PROFILE.phone,
              description: userData.description || DEFAULT_PROFILE.description,
              photoUrl: userData.photoUrl || DEFAULT_PROFILE.photoUrl,
              bannerUrl: userData.bannerUrl || DEFAULT_PROFILE.bannerUrl,
              address: userData.address || DEFAULT_PROFILE.address,
              publicSlug: userData.publicSlug || DEFAULT_PROFILE.publicSlug,
              whatsappPhoneNumberId: userData.whatsappPhoneNumberId || '',
              whatsappToken: userData.whatsappToken || ''
            }));

            const encryptedToken = userData.whatsappToken || '';
            if (encryptedToken) {
              decryptText(encryptedToken, userId).then(decrypted => {
                setProfile(prev => {
                  if (prev.uid === userId) {
                    return { ...prev, whatsappToken: decrypted };
                  }
                  return prev;
                });
              });
            }

            // Sync other subcollections in real-time
            try {
              const unsubscribeSchedule = onSnapshot(doc(db, 'users', userId, 'schedules', 'default_schedule'), (snap) => {
                if (snap.exists()) {
                  const data = snap.data() as WorkingSettings;
                  setProfile(prev => ({
                    ...prev,
                    workingSettings: {
                      intervalMinutes: data.intervalMinutes || 30,
                      workingDays: data.workingDays || [],
                      blockedDates: data.blockedDates || []
                    }
                  }));
                }
              }, (error) => {
                console.error("Public schedule sync error:", error);
              });
              activeUnsubscribers.push(unsubscribeSchedule);
            } catch (schedErr: any) {
              console.error("FirebaseContext: Error starting schedules listener:", schedErr.message);
            }

            try {
              const unsubscribeServices = onSnapshot(collection(db, 'users', userId, 'services'), (snap) => {
                const list: Service[] = [];
                snap.forEach(doc => {
                  list.push(doc.data() as Service);
                });
                setServices(list);
              }, (error) => {
                console.error("Public services sync error:", error);
              });
              activeUnsubscribers.push(unsubscribeServices);
            } catch (servErr: any) {
              console.error("FirebaseContext: Error starting services listener:", servErr.message);
            }

            try {
              const unsubscribeAppointments = onSnapshot(collection(db, 'users', userId, 'appointments'), (snap) => {
                const list: Appointment[] = [];
                snap.forEach(doc => {
                  list.push(doc.data() as Appointment);
                });
                list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
                setAppointments(list);
              }, (error) => {
                console.error("Public appointments sync error:", error);
              });
              activeUnsubscribers.push(unsubscribeAppointments);
            } catch (appErr: any) {
              console.error("FirebaseContext: Error starting appointments listener:", appErr.message);
            }
          } else {
            console.warn("FirebaseContext: No user data profile located.");
          }
        } catch (err: any) {
          console.error("Failed to fetch public professional configuration:", err.message, err);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      const userId = firebaseUser.uid;

      try {
        // Step 1: Check if profile document exists in Firestore
        const profileDocRef = doc(db, 'users', userId);
        const profileSnapshot = await getDoc(profileDocRef);

        // If the user changed or unsubscribed mid-flight, do not proceed
        if (auth.currentUser?.uid !== userId) {
          setIsLoading(false);
          return;
        }

        if (!profileSnapshot.exists()) {
          // SEED DATABASE FOR NEW USER (Satisfies the onboarding experience)
          console.log("Pre-populating Firestore for new user:", userId);
          
          const tempName = localStorage.getItem('af_temp_reg_name') || firebaseUser.displayName || 'Juliana Costa';
          const tempPhone = localStorage.getItem('af_temp_reg_phone') || '(11) 98765-4321';
          const tempCategory = localStorage.getItem('af_temp_reg_category') || 'Beleza e Bem-Estar';
          const tempEmail = firebaseUser.email || 'contato@studioessence.com';
          const generatedSlug = (tempName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + userId.slice(0, 4)).toLowerCase();

          localStorage.removeItem('af_temp_reg_name');
          localStorage.removeItem('af_temp_reg_phone');
          localStorage.removeItem('af_temp_reg_category');

          await setDoc(profileDocRef, sanitizeUser({
            name: tempName,
            email: tempEmail,
            phone: tempPhone,
            description: `Especialista em ${tempCategory}. Oferecemos serviços personalizados com agendamento online fácil e rápido.`,
            address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
            publicSlug: generatedSlug,
            photoUrl: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=200&h=200'
          }, userId));

          await setDoc(doc(db, 'users', userId, 'schedules', 'default_schedule'), sanitizeSchedule(DEFAULT_PROFILE.workingSettings));

          // Seed services
          for (const s of DEFAULT_SERVICES) {
            await setDoc(doc(db, 'users', userId, 'services', s.id), sanitizeService(s));
          }

          // Seed customers
          for (const c of DEFAULT_CUSTOMERS) {
            await setDoc(doc(db, 'users', userId, 'customers', c.id), sanitizeCustomer(c));
          }

          // Seed appointments
          for (const a of DEFAULT_APPOINTMENTS) {
            await setDoc(doc(db, 'users', userId, 'appointments', a.id), sanitizeAppointment(a));
          }

          // Seed default audit logs
          for (const log of DEFAULT_AUDIT_LOGS) {
            await setDoc(doc(db, 'users', userId, 'audit_logs', log.id), log);
          }
        }

        // Check if user changed mid-flight before registering real-time listeners
        if (auth.currentUser?.uid !== userId) {
          setIsLoading(false);
          return;
        }

        // Step 2: Establish real-time sync with snapshot listeners
        const unsubscribeProfile = onSnapshot(doc(db, 'users', userId), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setProfile(prev => ({
              ...prev,
              uid: userId,
              name: data.name,
              email: data.email,
              phone: data.phone,
              description: data.description,
              photoUrl: data.photoUrl,
              bannerUrl: data.bannerUrl,
              address: data.address,
              publicSlug: data.publicSlug,
              whatsappPhoneNumberId: data.whatsappPhoneNumberId || '',
              whatsappToken: data.whatsappToken || ''
            }));

            const encryptedToken = data.whatsappToken || '';
            if (encryptedToken) {
              decryptText(encryptedToken, userId).then(decrypted => {
                setProfile(prev => {
                  if (prev.uid === userId) {
                    return { ...prev, whatsappToken: decrypted };
                  }
                  return prev;
                });
              });
            }
          }
        }, (error) => {
          if (auth.currentUser?.uid === userId) {
            handleFirestoreError(error, OperationType.GET, `users/${userId}`, false);
          }
        });
        activeUnsubscribers.push(unsubscribeProfile);

        const unsubscribeSchedule = onSnapshot(doc(db, 'users', userId, 'schedules', 'default_schedule'), (snap) => {
          if (snap.exists()) {
            const data = snap.data() as WorkingSettings;
            setProfile(prev => ({
              ...prev,
              workingSettings: {
                intervalMinutes: data.intervalMinutes || 30,
                workingDays: data.workingDays || [],
                blockedDates: data.blockedDates || []
              }
            }));
          }
        }, (error) => {
          if (auth.currentUser?.uid === userId) {
            handleFirestoreError(error, OperationType.GET, `users/${userId}/schedules/default_schedule`, false);
          }
        });
        activeUnsubscribers.push(unsubscribeSchedule);

        const unsubscribeServices = onSnapshot(collection(db, 'users', userId, 'services'), (snap) => {
          const list: Service[] = [];
          snap.forEach(doc => {
            list.push(doc.data() as Service);
          });
          setServices(list);
        }, (error) => {
          if (auth.currentUser?.uid === userId) {
            handleFirestoreError(error, OperationType.GET, `users/${userId}/services`, false);
          }
        });
        activeUnsubscribers.push(unsubscribeServices);

        const unsubscribeAppointments = onSnapshot(collection(db, 'users', userId, 'appointments'), (snap) => {
          const list: Appointment[] = [];
          snap.forEach(doc => {
            list.push(doc.data() as Appointment);
          });
          // Sort appointments descending
          list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setAppointments(list);
        }, (error) => {
          if (auth.currentUser?.uid === userId) {
            handleFirestoreError(error, OperationType.GET, `users/${userId}/appointments`, false);
          }
        });
        activeUnsubscribers.push(unsubscribeAppointments);

        const unsubscribeCustomers = onSnapshot(collection(db, 'users', userId, 'customers'), (snap) => {
          const list: Customer[] = [];
          snap.forEach(doc => {
            list.push(doc.data() as Customer);
          });
          setCustomers(list);
        }, (error) => {
          if (auth.currentUser?.uid === userId) {
            handleFirestoreError(error, OperationType.GET, `users/${userId}/customers`, false);
          }
        });
        activeUnsubscribers.push(unsubscribeCustomers);

        const unsubscribeAuditLogs = onSnapshot(collection(db, 'users', userId, 'audit_logs'), (snap) => {
          const list: AuditLog[] = [];
          snap.forEach(doc => {
            list.push(doc.data() as AuditLog);
          });
          // Sort audit logs descending by timestamp
          list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
          setAuditLogs(list);
        }, (error) => {
          if (auth.currentUser?.uid === userId) {
            handleFirestoreError(error, OperationType.GET, `users/${userId}/audit_logs`, false);
          }
        });
        activeUnsubscribers.push(unsubscribeAuditLogs);

        setIsLoading(false);

      } catch (err) {
        console.error("Auth init sync failed:", err);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      clearActiveListeners();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Popup Sign In error:", error);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email Sign In error:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, phone: string, category: string) => {
    try {
      localStorage.setItem('af_temp_reg_name', name);
      localStorage.setItem('af_temp_reg_phone', phone);
      localStorage.setItem('af_temp_reg_category', category);
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email Sign Up error:", error);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      // Revert variables to local defaults upon logout to keep UX fast
      setIsDemoLoggedIn(false);
      setProfile(DEFAULT_PROFILE);
      setServices(DEFAULT_SERVICES);
      setAppointments(DEFAULT_APPOINTMENTS);
      setCustomers(DEFAULT_CUSTOMERS);
      setAuditLogs(DEFAULT_AUDIT_LOGS);
    } catch (error) {
      console.error("Sign Out error:", error);
    }
  };

  const updateProfile = async (updates: Partial<ProfessionalProfile>) => {
    // Local memory updates for instant interface speed
    setProfile(prev => ({
      ...prev,
      ...updates,
      workingSettings: updates.workingSettings ? { ...prev.workingSettings, ...updates.workingSettings } : prev.workingSettings
    }));

    addAuditLog('Atualizar Perfil', 'Perfil do Usuário', `Nome: ${updates.name || 'Inalterado'}, Fone: ${updates.phone || 'Inalterado'}, Descrição: ${updates.description || 'Inalterada'}`);

    if (auth.currentUser) {
      const path = `users/${auth.currentUser.uid}`;
      try {
        let encryptedUpdates = { ...updates };
        if (updates.whatsappToken !== undefined) {
          if (updates.whatsappToken) {
            encryptedUpdates.whatsappToken = await encryptText(updates.whatsappToken, auth.currentUser.uid);
          } else {
            encryptedUpdates.whatsappToken = '';
          }
        }
        const sanitized = sanitizeUser({ ...profile, ...encryptedUpdates }, auth.currentUser.uid);
        await setDoc(doc(db, 'users', auth.currentUser.uid), sanitized, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  const addService = async (newSrv: Omit<Service, 'id'>) => {
    const srvId = `srv_${Date.now()}`;
    const service: Service = {
      ...newSrv,
      id: srvId
    };

    setServices(prev => [...prev, service]);

    addAuditLog('Cadastrar Serviço', `Serviço ${srvId} (${service.name})`, `Serviço criado com preço R$ ${service.price} e duração de ${service.duration} min.`);

    if (auth.currentUser) {
      const path = `users/${auth.currentUser.uid}/services/${srvId}`;
      try {
        const sanitized = sanitizeService(service);
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'services', srvId), sanitized);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

    addAuditLog('Atualizar Serviço', `Serviço ${id}`, `Campos atualizados: ${Object.keys(updates).join(', ')}`);

    if (auth.currentUser) {
      const path = `users/${auth.currentUser.uid}/services/${id}`;
      try {
        const original = services.find(s => s.id === id);
        const sanitized = sanitizeService({ ...original, ...updates, id });
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'services', id), sanitized, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  const deleteService = async (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));

    addAuditLog('Excluir Serviço', `Serviço ${id}`, `Remoção definitiva do serviço do catálogo.`);

    if (auth.currentUser) {
      const path = `users/${auth.currentUser.uid}/services/${id}`;
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'services', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  const addCustomer = async (cust: Omit<Customer, 'id' | 'totalAppointments' | 'lastAppointmentDate'>) => {
    const phoneDigits = cust.phone.replace(/\D/g, "");
    const customerId = `cust_${phoneDigits}`;
    const customer: Customer = {
      ...cust,
      id: customerId,
      totalAppointments: 0,
      lastAppointmentDate: ""
    };

    setCustomers(prev => {
      const exists = prev.some(c => c.id === customerId);
      if (exists) return prev;
      return [...prev, customer];
    });

    addAuditLog('Cadastrar Cliente', `Cliente ${customerId} (${customer.name})`, `Cliente criado.`);

    const targetUid = profile.uid || 'prof_essence_123';
    if (isFirebaseConnected) {
      const path = `users/${targetUid}/customers/${customerId}`;
      try {
        const sanitized = sanitizeCustomer(customer);
        // Save under professional (primary and single database structure for customers)
        await setDoc(doc(db, 'users', targetUid, 'customers', customerId), sanitized);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  const createAppointment = async (newApp: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment | string> => {
    // Check conflicts across loaded appointments
    const conflict = appointments.find(app => 
      app.date === newApp.date && 
      app.time === newApp.time && 
      app.status !== 'cancelled'
    );

    if (conflict) {
      return "CONFLITO_HORARIO";
    }

    const appId = `app_${Date.now()}`;
    const appointment: Appointment = {
      ...newApp,
      id: appId,
      status: newApp.status || 'pending', // Fallback status if missing to satisfy Firestore database validation
      createdAt: new Date().toISOString()
    };

    setAppointments(prev => [appointment, ...prev]);

    // Track/update customer locally (computed synchronously to avoid React state-updater race condition)
    const phoneDigits = newApp.customerPhone.replace(/\D/g, "");
    const customerId = `cust_${phoneDigits}`;
    
    const existingCust = customers.find(c => c.id === customerId);
    let finalCust: Customer;
    if (existingCust) {
      finalCust = {
        ...existingCust,
        name: newApp.customerName,
        email: newApp.customerEmail || existingCust.email,
        totalAppointments: existingCust.totalAppointments + 1,
        lastAppointmentDate: `${newApp.date} ${newApp.time}`
      };
    } else {
      finalCust = {
        id: customerId,
        name: newApp.customerName,
        phone: newApp.customerPhone,
        email: newApp.customerEmail || "",
        state: "",
        city: "",
        totalAppointments: 1,
        lastAppointmentDate: `${newApp.date} ${newApp.time}`
      };
    }

    setCustomers(prev => {
      const idx = prev.findIndex(c => c.id === customerId);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = finalCust;
        return copy;
      } else {
        return [...prev, finalCust];
      }
    });

    // Write to Firestore if connected to a professional workspace
    const targetUid = profile.uid || 'prof_essence_123';
    
    // Log write success
    const sourceString = auth.currentUser ? 'Administrador' : 'Link Público';
    addAuditLog('Criar Agendamento', `Agendamento ${appId}`, `Serviço: ${appointment.serviceName}, Cliente: ${appointment.customerName}, Data: ${appointment.date} às ${appointment.time}. Criado via: ${sourceString}`);

    // Explicitly check if we are synced & using a real account
    if (isFirebaseConnected) {
      const appPath = `users/${targetUid}/appointments/${appId}`;
      const custPath = `users/${targetUid}/customers/${customerId}`;

      try {
        // Run these as firesafe writes
        await setDoc(doc(db, 'users', targetUid, 'appointments', appId), sanitizeAppointment(appointment));
        
        // Look up if we need to write customer profile
        await setDoc(doc(db, 'users', targetUid, 'customers', customerId), sanitizeCustomer(finalCust));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, appPath);
      }
    }

    // Client alert notification (local UI)
    const newNotif: AppNotification = {
      id: `not_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type: 'confirm',
      title: 'Novo agendamento efetuado!',
      message: `${newApp.customerName} reservou ${newApp.serviceName} para o dia ${newApp.date} às ${newApp.time}.`,
      read: false,
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => [newNotif, ...prev]);

    if (appointment.status === 'confirmed') {
      sendWhatsAppConfirmation(appointment, profile.name, profile.whatsappPhoneNumberId, profile.whatsappToken).catch(err => {
        console.error("Erro no envio do WhatsApp do novo agendamento:", err);
      });
    }

    return appointment;
  };

  const updateAppointmentStatus = async (id: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    let originalApp: Appointment | undefined;

    setAppointments(prev => prev.map(app => {
      if (app.id === id) {
        originalApp = app;
        if (app.status !== status) {
          const newNotif: AppNotification = {
            id: `not_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            type: status === 'cancelled' ? 'cancel' : 'confirm',
            title: status === 'cancelled' ? 'Agendamento Cancelado' : 'Agendamento Confirmado',
            message: `O agendamento de ${app.customerName} para o dia ${app.date} às ${app.time} foi alterado para ${status}.`,
            read: false,
            timestamp: new Date().toISOString()
          };
          setNotifications(n => [newNotif, ...n]);
        }
        return { ...app, status };
      }
      return app;
    }));

    addAuditLog('Alterar Status Agendamento', `Agendamento ${id}`, `Status alterado para '${status}'`);

    const targetUid = profile.uid || 'prof_essence_123';
    const original = originalApp || appointments.find(a => a.id === id);

    if (original) {
      const updatedApp = { ...original, status };

      if (isFirebaseConnected) {
        const appPath = `users/${targetUid}/appointments/${id}`;
        try {
          const sanitized = sanitizeAppointment(updatedApp);
          await setDoc(doc(db, 'users', targetUid, 'appointments', id), sanitized, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, appPath);
        }
      }

      // If the status is changing to confirmed, send WhatsApp message
      if (status === 'confirmed' && original.status !== 'confirmed') {
        sendWhatsAppConfirmation(updatedApp, profile.name, profile.whatsappPhoneNumberId, profile.whatsappToken).catch(err => {
          console.error("Erro no envio do WhatsApp ao alterar status:", err);
        });
      }
    }
  };

  const updateWorkingSettings = async (workingSettings: WorkingSettings) => {
    setProfile(prev => ({
      ...prev,
      workingSettings
    }));

    addAuditLog('Configurar Agenda', 'Horários e Datas Bloqueadas', `Regras atualizadas. ${workingSettings.workingDays.filter(d => d.enabled).length} de 7 dias úteis ativos. Bloqueios offline: ${workingSettings.blockedDates.length}`);

    if (auth.currentUser) {
      const path = `users/${auth.currentUser.uid}/schedules/default_schedule`;
      try {
        const sanitized = sanitizeSchedule(workingSettings);
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'schedules', 'default_schedule'), sanitized);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  const clearNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const addAuditLog = async (action: string, target: string, details: string) => {
    const logId = `log_${Date.now()}`;
    const userEmail = auth.currentUser?.email || profile.email || 'jorgeavilamiranda11@gmail.com';
    const logItem: AuditLog = {
      id: logId,
      action,
      target,
      timestamp: new Date().toISOString(),
      details,
      userEmail
    };

    setAuditLogs(prev => [logItem, ...prev]);

    const targetUid = auth.currentUser?.uid || profile.uid || 'prof_essence_123';
    if (isFirebaseConnected) {
      const path = `users/${targetUid}/audit_logs/${logId}`;
      try {
        await setDoc(doc(db, 'users', targetUid, 'audit_logs', logId), logItem);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  const fetchCustomerAndSync = async (phone: string): Promise<Customer | null> => {
    const phoneDigits = phone.replace(/\D/g, "");
    const customerId = `cust_${phoneDigits}`;
    const targetUid = profile.uid || 'prof_essence_123';
    
    if (isFirebaseConnected) {
      try {
        // Retrieve directly from the structured 'customers' subcollection under active professional
        const customerDocRef = doc(db, 'users', targetUid, 'customers', customerId);
        const customerSnap = await getDoc(customerDocRef);
        if (customerSnap.exists()) {
          const fetchedCust = customerSnap.data() as Customer;

          setCustomers(prev => {
            const exists = prev.some(c => c.id === customerId);
            if (exists) {
              return prev.map(c => c.id === customerId ? fetchedCust : c);
            }
            return [...prev, fetchedCust];
          });
          
          return fetchedCust;
        }
      } catch (err) {
        console.error("Error fetching customer by phone:", err);
      }
    }
    return null;
  };

  const fetchAppointmentsAndSync = async (phone: string): Promise<void> => {
    if (isFirebaseConnected) {
      const targetUid = profile.uid || 'prof_essence_123';
      try {
        const phoneClean = phone.replace(/\D/g, '');
        const formatOld = (digits: string) => {
          if (digits.length === 11) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
          } else if (digits.length === 10) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
          }
          return digits;
        };
        const formatNew = (digits: string) => {
          if (digits.length === 11) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
          } else if (digits.length === 10) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
          }
          return digits;
        };
        const possiblePhones = Array.from(new Set([
          phone, 
          phoneClean, 
          formatOld(phoneClean), 
          formatNew(phoneClean)
        ])).filter(Boolean);

        if (possiblePhones.length === 0) return;

        const appointmentsRef = collection(db, 'users', targetUid, 'appointments');
        const q = query(appointmentsRef, where("customerPhone", "in", possiblePhones));
        const qSnap = await getDocs(q);
        const list: Appointment[] = [];
        qSnap.forEach((doc) => {
          list.push(doc.data() as Appointment);
        });
        
        if (list.length > 0) {
          setAppointments(prev => {
            const temp = [...prev];
            list.forEach(newApp => {
              const idx = temp.findIndex(a => a.id === newApp.id);
              if (idx > -1) {
                temp[idx] = newApp;
              } else {
                temp.push(newApp);
              }
            });
            return temp.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          });
        }
      } catch (err) {
        console.error("Error fetching appointments by phone:", err);
      }
    }
  };

  return (
    <FirebaseContext.Provider value={{
      user,
      isDemoLoggedIn,
      setIsDemoLoggedIn,
      profile,
      services,
      appointments,
      customers,
      notifications,
      auditLogs,
      isLoading,
      isFirebaseConnected,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOutUser,
      updateProfile,
      addService,
      updateService,
      deleteService,
      addCustomer,
      createAppointment,
      updateAppointmentStatus,
      updateWorkingSettings,
      clearNotifications,
      markNotificationRead,
      addAuditLog,
      sessionClient,
      setSessionClient,
      fetchCustomerAndSync,
      fetchAppointmentsAndSync
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

