
import React, { useEffect, useState, useRef } from 'react';
import { StoredCandidate, db, ScoreConfig, Notification } from '../utils/storage';
import { LogOut, User, FileText, Clock, CheckCircle, XCircle, Trophy, Users, Target, BookOpen, Phone, Edit2, Save, X, AlertTriangle, Lock, Info, Briefcase, Bell } from 'lucide-react';
import { InputGroup, SelectGroup } from './InputGroup';
import { TUNISIAN_GOVERNORATES, ListItem } from '../types';

interface CandidatePortalProps {
  candidate: StoredCandidate;
  onLogout: () => void;
}

const LABELS: Record<string, string> = {
    male: 'ذكر',
    female: 'أنثى',
    single: 'أعزب / عزباء',
    married: 'متزوج(ة)',
    divorced: 'مطلق(ة)',
    widowed: 'أرمل(ة)',
    completed: 'أدى الخدمة',
    exempt: 'معفى',
    postponed: 'مؤجل',
    not_concerned: 'غير معني',
    cnss: 'CNSS',
    cnrps: 'CNRPS',
    none: 'لا ينطبق',
};
  
const getLabel = (key: string) => LABELS[key] || key;

export const CandidatePortal: React.FC<CandidatePortalProps> = ({ candidate: initialCandidate, onLogout }) => {
  const [candidate, setCandidate] = useState(initialCandidate);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<StoredCandidate>(initialCandidate);
  
  // Dynamic Lists
  const [bacOptions, setBacOptions] = useState<ListItem[]>([]);
  const [degreeOptions, setDegreeOptions] = useState<ListItem[]>([]);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState<{
      myScore: number;
      rank: number;
      totalEligible: number;
      config: ScoreConfig;
      positionName: string;
      openPositions: number; // New stats field
      deadlineExpired: boolean;
      isRetained: boolean;
  } | null>(null);

  // Poll for status updates and notifications (simulating real-time update)
  useEffect(() => {
    // Fetch lists
    const lists = db.getLists();
    setBacOptions(lists.bacSpecialties);
    setDegreeOptions(lists.degrees);

    // Initial fetch
    setNotifications(db.getNotifications(candidate.id));

    const interval = setInterval(() => {
      const freshCandidates = db.getAll();
      const me = freshCandidates.find(c => c.id === candidate.id);
      
      // Update if status changed externally (by Admin)
      if (me && me.status !== candidate.status) {
        setCandidate(prev => ({ ...prev, status: me.status }));
      }

      // Fetch Notifications
      const freshNotifs = db.getNotifications(candidate.id);
      if (freshNotifs.length !== notifications.length || freshNotifs.some((n, i) => n.isRead !== notifications[i]?.isRead)) {
          setNotifications(freshNotifs);
      }

    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [candidate.id, candidate.status, notifications.length]);

  // Helper for dynamic labels
  const getDynamicLabel = (type: 'degree' | 'bac', value: string) => {
    if (type === 'degree') {
      return degreeOptions.find(d => d.value === value)?.label || value;
    } else {
      return bacOptions.find(b => b.value === value)?.label || value;
    }
  };

  // Click outside to close notification dropdown
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
              setShowNotifications(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
      const config = db.getScoreConfig();
      const score = db.calculateScore(candidate, config);
      const allCandidates = db.getAll();
      
      const deadlineDate = new Date(config.deadline || '');
      const isExpired = deadlineDate < new Date();

      // Calculation logic for ranking
      // Filter: Same Position AND Status Accepted
      const eligibleCandidates = allCandidates
        .filter(c => c.targetPositionNumber === candidate.targetPositionNumber && c.status === 'accepted')
        .sort((a, b) => db.calculateScore(b, config) - db.calculateScore(a, config)); // Sort Descending
      
      const totalEligible = eligibleCandidates.length;
      const myRank = eligibleCandidates.findIndex(c => c.id === candidate.id) + 1; // 1-based index
      const isRetained = myRank > 0 && myRank <= config.writtenExamCount;
      
      const pos = db.getPositionByCode(candidate.targetPositionNumber);

      setStats({
          myScore: score,
          rank: myRank,
          totalEligible: totalEligible,
          config: config,
          positionName: pos?.title || candidate.targetPositionNumber,
          openPositions: pos?.openPositions || 0,
          deadlineExpired: isExpired,
          isRetained: isRetained
      });
      
      // Sync edit data when candidate updates (after save or poll)
      setEditData(prev => ({...prev, status: candidate.status}));
  }, [candidate]);

  const handleSave = () => {
     if (stats?.deadlineExpired) {
         alert('عذراً، لقد انتهى أجل التعديل.');
         setIsEditing(false);
         return;
     }
     db.update(editData);
     setCandidate(editData);
     setIsEditing(false);
     alert('تم تحديث البيانات بنجاح');
  };

  const handleCancel = () => {
     setEditData(candidate);
     setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const markAllRead = () => {
      db.markAllAsRead(candidate.id);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Determines what status message to show
  const renderStatusCard = () => {
      // Priority 1: Explicit Decision (Accepted or Rejected)
      // If the admin has made a decision, show it immediately, regardless of the deadline.
      if (candidate.status === 'rejected') {
         return (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
                <XCircle size={20} />
                 <div>
                    <span className="font-bold block">ترشح مرفوض</span>
                    <span className="text-xs">ملف غير مطابق للشروط أو معلومات خاطئة</span>
                </div>
            </div>
         );
      } 
      
      if (candidate.status === 'accepted') {
         return (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                <CheckCircle size={20} />
                 <div>
                    <span className="font-bold block">كنديداتير معالجة (Candidature Traitée)</span>
                    <span className="text-xs">تمت دراسة الملف وقبوله شكلياً</span>
                </div>
            </div>
         );
      }

      // Priority 2: Pending Status
      if (!stats?.deadlineExpired) {
          // Before Deadline
          return (
            <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                <CheckCircle size={20} />
                <div>
                    <span className="font-bold block">ترشح مسجل</span>
                    <span className="text-xs">بانتظار غلق باب الترشحات للمعالجة</span>
                </div>
            </div>
          );
      } else {
          // After Deadline + Pending
          return (
            <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 px-4 py-3 rounded-lg border border-yellow-200">
                <Clock size={20} />
                <div>
                    <span className="font-bold block">في طور المعالجة</span>
                    <span className="text-xs">يتم حاليا دراسة الملفات من قبل الإدارة</span>
                </div>
            </div>
          );
      }
  };

  // Result Message logic based on acceptance
  const renderResultMessage = () => {
      if (candidate.status !== 'accepted' || !stats) return null;

      if (stats.isRetained) {
          return (
              <div className="mt-4 bg-green-600 text-white p-4 rounded-xl shadow-md border border-green-500 animate-fadeIn">
                  <div className="flex items-start gap-3">
                      <Trophy className="text-yellow-300 shrink-0" size={24} />
                      <div>
                          <h4 className="font-bold text-lg mb-1">تهانينا!</h4>
                          <p className="opacity-95 leading-relaxed">
                             أنت محتسب ضمن الـ <strong>{stats.config.writtenExamCount}</strong> الأوائل. 
                             تم قبولك لاجتياز الاختبار الكتابي.
                          </p>
                      </div>
                  </div>
              </div>
          );
      } else {
           return (
              <div className="mt-4 bg-gray-800 text-white p-4 rounded-xl shadow-md border border-gray-700 animate-fadeIn">
                  <div className="flex items-start gap-3">
                      <AlertTriangle className="text-gray-400 shrink-0" size={24} />
                      <div>
                          <h4 className="font-bold text-lg mb-1">نأسف لإعلامكم</h4>
                          <p className="opacity-90 leading-relaxed text-sm">
                             للأسف، مجموع نقاطكم لا يخولكم لتكونوا ضمن الـ <strong>{stats.config.writtenExamCount}</strong> الأوائل.
                             <br/>
                             نعتذر عن عدم قبولكم في هذه المرحلة.
                          </p>
                      </div>
                  </div>
              </div>
          );
      }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 relative z-20">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">مرحباً، {candidate.fullName}</h2>
          <p className="text-gray-500">رقم الملف: <span className="font-mono font-bold">{candidate.id.toUpperCase()}</span></p>
        </div>
        <div className="flex items-center gap-4">
            
            {/* Notification Bell */}
            <div className="relative" ref={notifDropdownRef}>
                <button 
                    onClick={() => {
                        setShowNotifications(!showNotifications);
                        if (!showNotifications && unreadCount > 0) markAllRead();
                    }}
                    className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <Bell className={unreadCount > 0 ? "text-primary-600" : "text-gray-500"} size={24} />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                            {unreadCount}
                        </span>
                    )}
                </button>
                
                {/* Dropdown */}
                {showNotifications && (
                    <div className="absolute left-0 mt-3 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fadeIn">
                        <div className="p-3 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-700 text-sm">الإشعارات ({notifications.length})</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">تحديد الكل كمقروء</button>
                            )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">لا توجد إشعارات جديدة</div>
                            ) : (
                                <ul className="divide-y divide-gray-50">
                                    {notifications.map(notif => (
                                        <li key={notif.id} className={`p-4 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/40' : ''}`}>
                                            <div className="flex gap-3">
                                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                                                    notif.type === 'success' ? 'bg-green-500' :
                                                    notif.type === 'danger' ? 'bg-red-500' :
                                                    notif.type === 'info' ? 'bg-blue-500' : 'bg-gray-400'
                                                }`} />
                                                <div className="flex-1">
                                                    <p className={`text-sm font-bold mb-1 ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 leading-relaxed">{notif.message}</p>
                                                    <span className="text-[10px] text-gray-400 mt-2 block">
                                                        {new Date(notif.createdAt).toLocaleDateString('ar-TN', {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors font-medium"
            >
            <LogOut size={18} />
            تسجيل الخروج
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Status & Score (Left on LTR, Right on RTL) */}
        <div className="lg:col-span-1 space-y-6">
             {/* Status Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-primary-500">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="text-primary-500" size={20} />
                    حالة ملف الترشح
                </h3>
                
                <div className="flex flex-col py-2 mb-4">
                   {renderStatusCard()}
                </div>
                <p className="text-xs text-gray-400 text-center border-t pt-3">تاريخ التسجيل: {new Date(candidate.submittedAt).toLocaleDateString('ar-TN')}</p>
            </div>

            {/* Score & Stats Card - ONLY visible if Accepted AND Deadline Passed */}
            {stats && stats.deadlineExpired && candidate.status === 'accepted' ? (
                <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white p-6 rounded-2xl shadow-lg animate-fadeIn">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Trophy className="text-yellow-400" size={20} />
                        نتائج الفرز
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-blue-700 pb-2">
                            <span className="opacity-80 text-sm">مجموعك الشخصي (Score)</span>
                            <span className="font-bold text-xl text-yellow-300">{stats.myScore.toFixed(3)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center border-b border-blue-700 pb-2">
                            <div className="flex items-center gap-2 opacity-80 text-sm">
                                <Users size={16} />
                                <span>عدد المؤهلين للخطة ({candidate.targetPositionNumber})</span>
                            </div>
                            <span className="font-bold text-lg">{stats.totalEligible}</span>
                        </div>

                         <div className="flex justify-between items-center border-b border-blue-700 pb-2">
                            <div className="flex items-center gap-2 opacity-80 text-sm">
                                <Briefcase size={16} />
                                <span>عدد الخطط المفتوحة</span>
                            </div>
                            <span className="font-bold text-lg">{stats.openPositions}</span>
                        </div>

                        {/* Result Message (Retained or Not) */}
                        {renderResultMessage()}
                        
                        <div className="mt-4 pt-3 border-t border-blue-700/50 text-xs text-blue-300 text-center">
                           يتم اختيار أفضل {stats.config.writtenExamCount} مترشحين
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center opacity-75">
                    <Lock className="mx-auto mb-2 text-gray-400" size={32} />
                    <h3 className="font-bold text-gray-600">نتائج الفرز</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        {stats?.deadlineExpired && candidate.status === 'rejected'
                            ? 'الملف مرفوض (لا توجد نتائج)'
                            : stats?.deadlineExpired && candidate.status !== 'accepted'
                                ? 'النتائج غير متوفرة بعد (قيد المعالجة)'
                                : 'تتوفر النتائج بعد غلق باب الترشحات ومعالجة الملفات'
                        }
                    </p>
                </div>
            )}

            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-indigo-900 mt-6">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                    <Info size={18} />
                    معلومات حول طاقة الاستيعاب
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border border-indigo-100">
                        <span className="block text-gray-500 text-xs mb-1">المرحلة الأولى (الكتابي)</span>
                        <span className="font-bold block">
                            يتم قبول أفضل {stats?.config.writtenExamCount} مترشحاً
                        </span>
                        <span className="text-xs text-gray-500">حسب المجموع الشخصي</span>
                    </div>
                    <div className="bg-white p-3 rounded border border-indigo-100">
                        <span className="block text-gray-500 text-xs mb-1">المرحلة الثانية (الشفوي)</span>
                        <span className="font-bold block">
                            يتم قبول أفضل {stats?.config.oralExamCount} مترشحين
                        </span>
                        <span className="text-xs text-gray-500">حسب نتائج الكتابي</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Column 2: Detailed Info */}
        <div className="lg:col-span-2">
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                            <User size={18} className="text-primary-600" />
                            البيانات المسجلة
                        </h4>
                        {!stats?.deadlineExpired && stats?.config.deadline && (
                             <p className="text-xs text-orange-700 mt-1 flex items-center gap-1 font-medium">
                                <Clock size={14} />
                                يمكن تحيين المعطيات إلى غاية: {new Date(stats.config.deadline).toLocaleDateString('ar-TN', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                             </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                             stats?.deadlineExpired ? (
                                <span className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg flex items-center gap-1 font-bold border border-red-100">
                                    <AlertTriangle size={14} />
                                    انتهى أجل التعديل
                                </span>
                             ) : (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="text-sm bg-white border border-gray-300 hover:bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                                >
                                    <Edit2 size={14} />
                                    تعديل البيانات
                                </button>
                             )
                        )}
                        {isEditing && (
                            <div className="flex gap-2">
                                 <button 
                                    onClick={handleCancel}
                                    className="text-sm bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 shadow-sm"
                                >
                                    <X size={14} />
                                    إلغاء
                                </button>
                                <button 
                                    onClick={handleSave}
                                    className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 shadow-sm"
                                >
                                    <Save size={14} />
                                    حفظ
                                </button>
                            </div>
                        )}
                    </div>
                 </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    
                    {/* Group 1: Bac Info */}
                    <div className="col-span-1 md:col-span-2">
                        <h5 className="text-sm font-bold text-gray-500 mb-3 border-b pb-1 flex items-center gap-2">
                            <BookOpen size={14} />
                            بيانات البكالوريا
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                                {isEditing ? (
                                    <SelectGroup 
                                        label="الشعبة" name="bacSpecialty" 
                                        value={editData.bacSpecialty} onChange={handleChange} options={bacOptions} 
                                        className="mb-0"
                                    />
                                ) : (
                                    <>
                                        <span className="block text-xs text-gray-500 mb-1">الشعبة</span>
                                        <span className="font-bold text-gray-900">{getDynamicLabel('bac', candidate.bacSpecialty) || '-'}</span>
                                    </>
                                )}
                            </div>
                            <div>
                                {isEditing ? (
                                    <InputGroup 
                                        label="سنة الحصول" name="bacYear" type="number"
                                        value={editData.bacYear} onChange={handleChange} 
                                        className="mb-0"
                                    />
                                ) : (
                                    <>
                                        <span className="block text-xs text-gray-500 mb-1">سنة الحصول</span>
                                        <span className="font-bold text-gray-900">{candidate.bacYear || '-'}</span>
                                    </>
                                )}
                            </div>
                            <div>
                                {isEditing ? (
                                    <InputGroup 
                                        label="المعدل" name="bacAverage" type="number" step="0.01"
                                        value={editData.bacAverage} onChange={handleChange} 
                                        className="mb-0 font-mono"
                                    />
                                ) : (
                                    <>
                                        <span className="block text-xs text-gray-500 mb-1">المعدل</span>
                                        <span className="font-bold text-gray-900 font-mono text-lg">{candidate.bacAverage}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                     {/* Group 2: University Info */}
                     <div className="col-span-1 md:col-span-2">
                        <h5 className="text-sm font-bold text-gray-500 mb-3 border-b pb-1 flex items-center gap-2">
                            <BookOpen size={14} />
                            بيانات الشهادة الجامعية
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                             <div className="md:col-span-3">
                                {isEditing ? (
                                    <SelectGroup 
                                        label="الشهادة" name="degree" 
                                        value={editData.degree} onChange={handleChange} 
                                        className="mb-0"
                                        options={degreeOptions}
                                    />
                                ) : (
                                    <>
                                        <span className="block text-xs text-gray-500 mb-1">الشهادة</span>
                                        <span className="font-bold text-gray-900">{getDynamicLabel('degree', candidate.degree)}</span>
                                    </>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                {isEditing ? (
                                    <InputGroup 
                                        label="الاختصاص" name="specialty" 
                                        value={editData.specialty} onChange={handleChange} 
                                        className="mb-0"
                                    />
                                ) : (
                                    <>
                                        <span className="block text-xs text-gray-500 mb-1">الاختصاص</span>
                                        <span className="font-bold text-gray-900">{candidate.specialty}</span>
                                    </>
                                )}
                            </div>
                            <div>
                                {isEditing ? (
                                    <InputGroup 
                                        label="معدل التخرج" name="gradAverage" type="number" step="0.01"
                                        value={editData.gradAverage} onChange={handleChange} 
                                        className="mb-0 font-mono"
                                    />
                                ) : (
                                    <>
                                        <span className="block text-xs text-gray-500 mb-1">معدل التخرج</span>
                                        <span className="font-bold text-gray-900 font-mono text-lg">{candidate.gradAverage}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Group 3: General Info */}
                    <div className="md:col-span-2">
                        <h5 className="text-sm font-bold text-gray-500 mb-3 border-b pb-1">معلومات عامة</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="flex flex-col justify-center border-b border-gray-100 pb-2">
                                <span className="text-gray-600 text-sm mb-1">رقم بطاقة التعريف</span>
                                <span className="font-mono font-bold" dir="ltr">{candidate.cin}</span>
                            </div>
                            <div className="flex flex-col justify-center border-b border-gray-100 pb-2">
                                <span className="text-gray-600 text-sm flex items-center gap-1 mb-1">
                                    <Phone size={12} />
                                    رقم الهاتف الجوال
                                </span>
                                {isEditing ? (
                                    <InputGroup 
                                        label="" name="mobile" type="tel" maxLength={8}
                                        value={editData.mobile} onChange={handleChange} 
                                        className="mb-0" dir="ltr"
                                    />
                                ) : (
                                    <span className="font-mono font-bold" dir="ltr">{candidate.mobile}</span>
                                )}
                            </div>
                            <div className="flex flex-col justify-center border-b border-gray-100 pb-2">
                                <span className="text-gray-600 text-sm mb-1">تاريخ الولادة</span>
                                {isEditing ? (
                                    <InputGroup 
                                        label="" name="birthDate" type="date"
                                        value={editData.birthDate} onChange={handleChange} 
                                        className="mb-0"
                                    />
                                ) : (
                                    <span className="font-medium">{candidate.birthDate}</span>
                                )}
                            </div>
                             <div className="flex flex-col justify-center border-b border-gray-100 pb-2">
                                <span className="text-gray-600 text-sm mb-1">مكان الولادة</span>
                                {isEditing ? (
                                    <SelectGroup 
                                        label="" name="birthPlace" 
                                        value={editData.birthPlace} onChange={handleChange} 
                                        options={TUNISIAN_GOVERNORATES.map(g => ({ value: g, label: g }))}
                                        className="mb-0"
                                    />
                                ) : (
                                    <span className="font-medium">{candidate.birthPlace}</span>
                                )}
                            </div>
                             
                             {/* Position Name */}
                             <div className={`${isEditing ? 'md:col-span-2' : ''} flex flex-col justify-center border-b border-gray-100 pb-2`}>
                                <span className="text-gray-600 text-sm mb-1">الخطة</span>
                                {isEditing ? (
                                    <InputGroup 
                                        label="" name="targetPositionNumber" 
                                        value={editData.targetPositionNumber} onChange={handleChange} 
                                        className="mb-0" placeholder="رقم الخطة"
                                    />
                                ) : (
                                    <span className="font-medium">{stats?.positionName} ({candidate.targetPositionNumber})</span>
                                )}
                            </div>
                            
                            {/* Open Positions Count (Only show when not editing) */}
                            {!isEditing && (
                                <div className="flex flex-col justify-center border-b border-gray-100 pb-2">
                                    <span className="text-gray-600 text-sm mb-1">عدد الخطط المفتوحة للتناظر</span>
                                    <div className="flex items-center gap-2">
                                        <Briefcase size={18} className="text-primary-500" />
                                        <span className="font-bold text-xl text-primary-700">{stats?.openPositions ?? '-'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
             </div>

              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-blue-800 mt-6">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    ملاحظات هامة
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm opacity-90 leading-relaxed">
                    <li>يرجى متابعة هذا الفضاء بانتظام لمعرفة مآل الترشح.</li>
                    <li>سيتم تحيين حالة ملفك فور دراسته من قبل اللجنة المختصة.</li>
                    <li>في حالة القبول الأولي، ستتم دعوتك لإجراء الاختبارات الكتابية أو الشفاهية عبر هذا الفضاء وعبر البريد الإلكتروني.</li>
                    <li className="font-bold text-red-600">نعلمكم أنه لا يمكن تعديل البيانات بعد تاريخ غلق باب الترشحات.</li>
                </ul>
            </div>
        </div>

      </div>
    </div>
  );
};
