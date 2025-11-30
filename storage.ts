
import { CandidateData, ListItem } from '../types';

export interface StoredCandidate extends CandidateData {
  id: string;
  submittedAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  password?: string;
}

export interface ScoreConfig {
  bacWeight: number; // e.g., 40 means 0.4 or 40%
  gradWeight: number; // e.g., 60 means 0.6 or 60%
  writtenExamCount: number; // N: Candidates retained for written exam
  oralExamCount: number; // M: Candidates retained for oral exam
  deadline?: string; // ISO Date string for recruitment deadline
}

export interface Position {
  code: string; // The number/code of the position
  title: string; // The name of the position
  openPositions: number; // Number of open spots for this position
}

export interface Notification {
  id: string;
  candidateId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  isRead: boolean;
  createdAt: string;
}

const DB_KEY = 'recruitment_app_db_v1';
const SETTINGS_KEY = 'recruitment_app_settings_v1';
const POSITIONS_KEY = 'recruitment_app_positions_v1';
const NOTIFICATIONS_KEY = 'recruitment_app_notifications_v1';
const LISTS_KEY = 'recruitment_app_lists_v1';

// Initial positions for demonstration
const INITIAL_POSITIONS: Position[] = [
  { code: '101', title: 'مهندس أول في الإعلامية', openPositions: 5 },
  { code: '102', title: 'متصرف إداري', openPositions: 3 },
  { code: '103', title: 'تقني سامي في الشبكات', openPositions: 4 }
];

// Initial Lists
const INITIAL_BAC_SPECIALTIES: ListItem[] = [
  { value: 'math', label: 'رياضيات' },
  { value: 'science', label: 'علوم تجريبية' },
  { value: 'tech', label: 'علوم تقنية' },
  { value: 'eco', label: 'اقتصاد وتصرف' },
  { value: 'letters', label: 'آداب' },
  { value: 'sport', label: 'رياضة' },
  { value: 'info', label: 'علوم الإعلامية' },
];

const INITIAL_DEGREES: ListItem[] = [
  { value: 'license', label: 'إجازة' },
  { value: 'master', label: 'ماجستير' },
  { value: 'engineer', label: 'شهادة مهندس' },
  { value: 'doctorate', label: 'دكتوراه' },
  { value: 'technician', label: 'تقني سامي' },
];

interface AppLists {
  bacSpecialties: ListItem[];
  degrees: ListItem[];
}

export const db = {
  // --- Candidates ---
  getAll: (): StoredCandidate[] => {
    try {
      const data = localStorage.getItem(DB_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading from local DB', e);
      return [];
    }
  },

  add: (candidate: CandidateData): StoredCandidate => {
    const currentData = db.getAll();
    
    // Generate a random 8-character password
    const generatedPassword = Math.random().toString(36).slice(-8);

    const newRecord: StoredCandidate = {
      ...candidate,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      submittedAt: new Date().toISOString(),
      status: 'pending',
      password: generatedPassword
    };
    
    const updatedData = [newRecord, ...currentData];
    localStorage.setItem(DB_KEY, JSON.stringify(updatedData));

    // Send Welcome Notification
    db.addNotification({
      candidateId: newRecord.id,
      title: 'مرحباً بك في بوابة المناظرات',
      message: `تم تسجيل ترشحك بنجاح. بيانات الدخول الخاصة بك هي: البريد: ${newRecord.email} / كلمة العبور: ${generatedPassword}`,
      type: 'success'
    });

    return newRecord;
  },

  update: (candidate: StoredCandidate) => {
    const current = db.getAll();
    const index = current.findIndex(c => c.id === candidate.id);
    if (index !== -1) {
      current[index] = { ...candidate, submittedAt: new Date().toISOString() }; // Optionally update timestamp
      localStorage.setItem(DB_KEY, JSON.stringify(current));
    }
  },

  updateStatus: (id: string, status: 'pending' | 'accepted' | 'rejected') => {
    const current = db.getAll();
    const index = current.findIndex(c => c.id === id);
    if (index !== -1) {
      const oldStatus = current[index].status;
      current[index].status = status;
      localStorage.setItem(DB_KEY, JSON.stringify(current));

      // Trigger Notification only if status changed
      if (oldStatus !== status) {
        let title = 'تحديث حالة الملف';
        let message = '';
        let type: Notification['type'] = 'info';

        if (status === 'accepted') {
          title = 'تم قبول ملفك';
          message = 'تهانينا، تمت مراجعة ملفك وقبوله أولياً. يرجى متابعة النتائج.';
          type = 'success';
        } else if (status === 'rejected') {
          title = 'رفض الملف';
          message = 'نأسف لإعلامك أنه تم رفض ملفك لعدم تطابق الشروط.';
          type = 'danger';
        } else {
          message = 'تمت إعادة ملفك لوضعية الانتظار للمراجعة.';
        }

        db.addNotification({
          candidateId: id,
          title,
          message,
          type
        });
      }
    }
  },

  login: (email: string, password: string): StoredCandidate | null => {
    const candidates = db.getAll();
    const user = candidates.find(c => c.email === email && c.password === password);
    return user || null;
  },

  resetPassword: (email: string): string | null => {
    const current = db.getAll();
    const index = current.findIndex(c => c.email === email);
    
    if (index !== -1) {
      const newPassword = Math.random().toString(36).slice(-8);
      current[index].password = newPassword;
      localStorage.setItem(DB_KEY, JSON.stringify(current));
      return newPassword;
    }
    return null;
  },

  clear: () => {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(NOTIFICATIONS_KEY);
  },

  // --- Notifications ---
  getNotifications: (candidateId: string): Notification[] => {
    try {
      const data = localStorage.getItem(NOTIFICATIONS_KEY);
      const all: Notification[] = data ? JSON.parse(data) : [];
      return all.filter(n => n.candidateId === candidateId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
      return [];
    }
  },

  addNotification: (note: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    try {
      const data = localStorage.getItem(NOTIFICATIONS_KEY);
      const all: Notification[] = data ? JSON.parse(data) : [];
      
      const newNote: Notification = {
        ...note,
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        createdAt: new Date().toISOString(),
        isRead: false
      };

      const updated = [newNote, ...all];
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to add notification', e);
    }
  },

  markAsRead: (notificationId: string) => {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!data) return;
    const all: Notification[] = JSON.parse(data);
    const updated = all.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  },
  
  markAllAsRead: (candidateId: string) => {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!data) return;
    const all: Notification[] = JSON.parse(data);
    const updated = all.map(n => n.candidateId === candidateId ? { ...n, isRead: true } : n);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  },

  // --- Score Configuration ---
  getScoreConfig: (): ScoreConfig => {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      const parsed = data ? JSON.parse(data) : {};
      
      // Default deadline: 7 days from now if not set
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 7);

      return {
        bacWeight: parsed.bacWeight ?? 40,
        gradWeight: parsed.gradWeight ?? 60,
        writtenExamCount: parsed.writtenExamCount ?? 20,
        oralExamCount: parsed.oralExamCount ?? 10,
        deadline: parsed.deadline ?? defaultDeadline.toISOString()
      };
    } catch (e) {
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 7);
      return { 
        bacWeight: 40, 
        gradWeight: 60, 
        writtenExamCount: 20, 
        oralExamCount: 10,
        deadline: defaultDeadline.toISOString()
      };
    }
  },

  saveScoreConfig: (config: ScoreConfig) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(config));
  },

  calculateScore: (candidate: StoredCandidate, config: ScoreConfig): number => {
    const bacAvg = parseFloat(candidate.bacAverage) || 0;
    const gradAvg = parseFloat(candidate.gradAverage) || 0;
    
    // Formula: (Bac * bacWeight%) + (Grad * gradWeight%)
    const score = (bacAvg * (config.bacWeight / 100)) + (gradAvg * (config.gradWeight / 100));
    return parseFloat(score.toFixed(3)); // Return with 3 decimal places
  },

  // --- Positions (Plans) Management ---
  getPositions: (): Position[] => {
    try {
      const data = localStorage.getItem(POSITIONS_KEY);
      if (!data) {
        // Initialize with defaults if empty
        localStorage.setItem(POSITIONS_KEY, JSON.stringify(INITIAL_POSITIONS));
        return INITIAL_POSITIONS;
      }
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  },

  addPosition: (pos: Position) => {
    const current = db.getPositions();
    // Check if exists
    if (current.find(p => p.code === pos.code)) {
      throw new Error('Position code already exists');
    }
    const updated = [...current, pos];
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(updated));
    return updated;
  },

  updatePosition: (oldCode: string, updatedPos: Position) => {
    const current = db.getPositions();
    
    // If the code is being changed, check if the NEW code already exists elsewhere
    if (oldCode !== updatedPos.code && current.find(p => p.code === updatedPos.code)) {
       throw new Error('Position code already exists');
    }

    const index = current.findIndex(p => p.code === oldCode);
    if (index !== -1) {
      current[index] = updatedPos;
      localStorage.setItem(POSITIONS_KEY, JSON.stringify(current));
    }
    return current;
  },

  deletePosition: (code: string) => {
    const current = db.getPositions();
    const updated = current.filter(p => p.code !== code);
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(updated));
    return updated;
  },
  
  getPositionByCode: (code: string): Position | undefined => {
     const positions = db.getPositions();
     return positions.find(p => p.code === code);
  },

  // --- Lists Management (Bac Specialties & Degrees) ---
  getLists: (): AppLists => {
    try {
      const data = localStorage.getItem(LISTS_KEY);
      if (data) return JSON.parse(data);
      
      // Initialize defaults
      const defaults: AppLists = {
        bacSpecialties: INITIAL_BAC_SPECIALTIES,
        degrees: INITIAL_DEGREES
      };
      localStorage.setItem(LISTS_KEY, JSON.stringify(defaults));
      return defaults;
    } catch (e) {
      return { bacSpecialties: INITIAL_BAC_SPECIALTIES, degrees: INITIAL_DEGREES };
    }
  },

  saveList: (type: 'bacSpecialties' | 'degrees', items: ListItem[]) => {
    const current = db.getLists();
    const updated = { ...current, [type]: items };
    localStorage.setItem(LISTS_KEY, JSON.stringify(updated));
    return updated;
  },

  addItemToList: (type: 'bacSpecialties' | 'degrees', item: ListItem) => {
    const current = db.getLists();
    const list = current[type];
    
    // Check if value exists
    if (list.some(i => i.value === item.value)) {
       throw new Error('القيمة موجودة بالفعل');
    }

    const updatedList = [...list, item];
    db.saveList(type, updatedList);
  },

  updateItemInList: (type: 'bacSpecialties' | 'degrees', oldValue: string, newItem: ListItem) => {
    const current = db.getLists();
    const list = current[type];

    // If value changed, check if new value exists elsewhere
    if (oldValue !== newItem.value && list.some(i => i.value === newItem.value)) {
       throw new Error('القيمة موجودة بالفعل');
    }

    const updatedList = list.map(i => i.value === oldValue ? newItem : i);
    db.saveList(type, updatedList);
  },

  removeItemFromList: (type: 'bacSpecialties' | 'degrees', value: string) => {
    const current = db.getLists();
    const updatedList = current[type].filter(i => i.value !== value);
    db.saveList(type, updatedList);
  }
};
