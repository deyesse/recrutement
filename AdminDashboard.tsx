
import React, { useEffect, useState } from 'react';
import { db, StoredCandidate, ScoreConfig, Position } from '../utils/storage';
import { Eye, Trash2, User, BookOpen, Heart, Settings, Calculator, Save, Briefcase, Plus, Users, CalendarClock, CheckCircle, XCircle, Check, X, Edit2, List } from 'lucide-react';
import { ListItem } from '../types';

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

type Tab = 'candidates' | 'settings' | 'positions' | 'lists';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('candidates');
  
  // Data States
  const [candidates, setCandidates] = useState<StoredCandidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [bacSpecialties, setBacSpecialties] = useState<ListItem[]>([]);
  const [degrees, setDegrees] = useState<ListItem[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<StoredCandidate | null>(null);
  
  // Config States
  const [scoreConfig, setScoreConfig] = useState<ScoreConfig>({ 
    bacWeight: 40, 
    gradWeight: 60,
    writtenExamCount: 20,
    oralExamCount: 10,
    deadline: ''
  });
  
  // Position Form State
  const [newPos, setNewPos] = useState<{code: string; title: string; openPositions: number}>({ code: '', title: '', openPositions: 1 });
  const [editingCode, setEditingCode] = useState<string | null>(null); // Track if we are editing

  // Lists Form State
  const [newItem, setNewItem] = useState<ListItem>({ value: '', label: '' });
  const [listType, setListType] = useState<'bacSpecialties' | 'degrees'>('bacSpecialties');
  const [editingListValue, setEditingListValue] = useState<string | null>(null);

  const refreshData = () => {
    setCandidates(db.getAll());
    setScoreConfig(db.getScoreConfig());
    setPositions(db.getPositions());
    
    const lists = db.getLists();
    setBacSpecialties(lists.bacSpecialties);
    setDegrees(lists.degrees);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // --- Handlers ---

  const handleSaveConfig = () => {
    db.saveScoreConfig(scoreConfig);
    alert('تم حفظ الإعدادات بنجاح');
  };

  const handlePositionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPos.code || !newPos.title) return;

    try {
      if (editingCode) {
        // Update existing
        db.updatePosition(editingCode, newPos);
        alert('تم تعديل الخطة بنجاح');
        setEditingCode(null);
      } else {
        // Add new
        db.addPosition(newPos);
      }
      setNewPos({ code: '', title: '', openPositions: 1 });
      refreshData();
    } catch (error) {
      alert(editingCode ? 'فشل التعديل: رقم الخطة مستخدم بالفعل' : 'رقم الخطة موجود بالفعل');
    }
  };

  const handleEditPosition = (pos: Position) => {
    setEditingCode(pos.code);
    setNewPos({ ...pos });
  };

  const handleCancelEdit = () => {
    setEditingCode(null);
    setNewPos({ code: '', title: '', openPositions: 1 });
  };

  const handleDeletePosition = (code: string) => {
    if(window.confirm('هل أنت متأكد من حذف هذه الخطة؟')) {
      db.deletePosition(code);
      if (editingCode === code) {
        handleCancelEdit();
      }
      refreshData();
    }
  };

  // --- List Handlers ---
  const handleAddListItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.value || !newItem.label) return;
    
    try {
      if (editingListValue) {
        db.updateItemInList(listType, editingListValue, newItem);
        setEditingListValue(null);
      } else {
        db.addItemToList(listType, newItem);
      }
      setNewItem({ value: '', label: '' });
      refreshData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleEditListItem = (type: 'bacSpecialties' | 'degrees', item: ListItem) => {
    setListType(type);
    setNewItem({ ...item });
    setEditingListValue(item.value);
  };

  const handleCancelListEdit = () => {
    setEditingListValue(null);
    setNewItem({ value: '', label: '' });
  };

  const handleDeleteListItem = (type: 'bacSpecialties' | 'degrees', value: string) => {
    if(window.confirm('هل أنت متأكد من الحذف؟ سيظهر الرمز فقط في السجلات القديمة.')) {
      db.removeItemFromList(type, value);
      if (editingListValue === value) {
        handleCancelListEdit();
      }
      refreshData();
    }
  };

  // --- Candidate Actions ---
  const handleRejectCandidate = (id: string) => {
    if (window.confirm('هل أنت متأكد من رفض هذا الملف لعدم تطابق الشروط أو نقص المعطيات؟')) {
      db.updateStatus(id, 'rejected');
      refreshData();
    }
  };

  const handleAcceptCandidate = (id: string) => {
    db.updateStatus(id, 'accepted');
    refreshData();
  };

  const handleValidateAllPending = () => {
    const pendingCount = candidates.filter(c => c.status === 'pending').length;
    if (pendingCount === 0) {
      alert('لا يوجد مترشحين في حالة انتظار.');
      return;
    }

    if (window.confirm(`سيتم قبول جميع المترشحين المتبقين في حالة الانتظار (${pendingCount} مترشح). هل أنت متأكد؟`)) {
      // Bulk update logic to avoid multiple re-renders/storage writes
      const allData = db.getAll();
      const updatedData = allData.map(c => 
        c.status === 'pending' ? { ...c, status: 'accepted' as const } : c
      );
      localStorage.setItem('recruitment_app_db_v1', JSON.stringify(updatedData));
      
      refreshData();
    }
  };

  // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
  const getDeadlineInputValue = () => {
    if (!scoreConfig.deadline) return '';
    const date = new Date(scoreConfig.deadline);
    // Adjust to local ISO string for input
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const localDate = new Date(e.target.value);
    setScoreConfig(prev => ({ ...prev, deadline: localDate.toISOString() }));
  };

  // Sort candidates by score (Desc)
  const sortedCandidates = [...candidates].sort((a, b) => {
    const scoreA = db.calculateScore(a, scoreConfig);
    const scoreB = db.calculateScore(b, scoreConfig);
    return scoreB - scoreA;
  });

  // Helper to get label from dynamic lists
  const getDynamicLabel = (type: 'degree' | 'bac', value: string) => {
    if (type === 'degree') {
      return degrees.find(d => d.value === value)?.label || value;
    } else {
      return bacSpecialties.find(b => b.value === value)?.label || value;
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 min-h-[600px]">
        {/* Top Bar */}
        <div className="bg-gray-900 p-6 text-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">لوحة القيادة</h1>
            <p className="opacity-80 text-sm">إدارة البوابة - معالجة الترشحات</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
             <button 
              onClick={() => setActiveTab('candidates')}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${activeTab === 'candidates' ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <User size={16} />
              <span>المترشحين</span>
            </button>
            <button 
              onClick={() => setActiveTab('positions')}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${activeTab === 'positions' ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <Briefcase size={16} />
              <span>إدارة الخطط</span>
            </button>
            <button 
              onClick={() => setActiveTab('lists')}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${activeTab === 'lists' ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <List size={16} />
              <span>القوائم</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <Settings size={16} />
              <span>الإعدادات</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          
          {/* --- TAB: SETTINGS --- */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto animate-fadeIn space-y-8">
                
                {/* Recruitment Schedule Config */}
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
                    <h3 className="text-purple-900 font-bold flex items-center gap-2 mb-6 text-lg">
                    <CalendarClock size={24} />
                    جدولة المناظرة
                    </h3>
                    <div className="space-y-6">
                         <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                تاريخ غلق باب الترشحات
                                <span className="block text-xs font-normal text-gray-500 mt-1">لن يتم قبول أي ترشحات بعد هذا التاريخ</span>
                            </label>
                            <input 
                                type="datetime-local" 
                                value={getDeadlineInputValue()}
                                onChange={handleDeadlineChange}
                                className="w-full px-4 py-3 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none text-lg dir-ltr"
                            />
                        </div>
                    </div>
                </div>

                {/* Score Calculation Config */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                    <h3 className="text-blue-900 font-bold flex items-center gap-2 mb-6 text-lg">
                    <Calculator size={24} />
                    صيغة احتساب المجموع الشخصي (S)
                    </h3>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">ضارب معدل البكالوريا (%)</label>
                                <input 
                                    type="number" 
                                    value={scoreConfig.bacWeight}
                                    onChange={(e) => setScoreConfig(prev => ({ ...prev, bacWeight: Number(e.target.value) }))}
                                    className="w-full px-4 py-3 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">ضارب معدل التخرج (%)</label>
                                <input 
                                    type="number" 
                                    value={scoreConfig.gradWeight}
                                    onChange={(e) => setScoreConfig(prev => ({ ...prev, gradWeight: Number(e.target.value) }))}
                                    className="w-full px-4 py-3 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                                />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded border border-blue-200 text-blue-800 text-sm">
                             <strong>المعاينة:</strong> المجموع = (معدل البكالوريا × {scoreConfig.bacWeight/100}) + (معدل التخرج × {scoreConfig.gradWeight/100})
                        </div>
                    </div>
                </div>

                {/* Selection Thresholds Config */}
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
                    <h3 className="text-orange-900 font-bold flex items-center gap-2 mb-6 text-lg">
                    <Users size={24} />
                    طاقة استيعاب الاختبارات (Selection)
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                (N) عدد المترشحين المقبولين للاختبار الكتابي
                                <span className="block text-xs font-normal text-gray-500 mt-1">يتم اختيار أفضل N مترشح حسب المجموع الشخصي (S)</span>
                            </label>
                            <input 
                                type="number" 
                                value={scoreConfig.writtenExamCount}
                                onChange={(e) => setScoreConfig(prev => ({ ...prev, writtenExamCount: Number(e.target.value) }))}
                                className="w-full px-4 py-3 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none text-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                (M) عدد المترشحين المقبولين للاختبار الشفوي
                                <span className="block text-xs font-normal text-gray-500 mt-1">يتم اختيار أفضل M مترشح حسب نتيجة الاختبار الكتابي</span>
                            </label>
                            <input 
                                type="number" 
                                value={scoreConfig.oralExamCount}
                                onChange={(e) => setScoreConfig(prev => ({ ...prev, oralExamCount: Number(e.target.value) }))}
                                className="w-full px-4 py-3 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none text-lg"
                            />
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleSaveConfig}
                    className="w-full px-6 py-4 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg text-lg"
                >
                <Save size={20} />
                حفظ جميع الإعدادات
                </button>
            </div>
          )}

          {/* --- TAB: LISTS --- */}
          {activeTab === 'lists' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
              {/* Add/Edit Form */}
               <div className="lg:col-span-1">
                  <div className={`p-6 rounded-xl border sticky top-6 transition-all ${editingListValue ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className={`font-bold mb-4 flex items-center gap-2 ${editingListValue ? 'text-orange-900' : 'text-gray-800'}`}>
                      {editingListValue ? <Edit2 size={20} /> : <Plus size={20} />}
                      {editingListValue ? 'تعديل عنصر' : 'إضافة عنصر للقائمة'}
                    </h3>
                    <form onSubmit={handleAddListItem} className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">القائمة المستهدفة</label>
                        <select 
                          value={listType}
                          onChange={(e) => setListType(e.target.value as any)}
                          disabled={!!editingListValue}
                          className={`w-full p-2 border rounded bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none ${editingListValue ? 'bg-gray-100 text-gray-500' : ''}`}
                        >
                          <option value="bacSpecialties">شعب البكالوريا</option>
                          <option value="degrees">الشهادات العلمية</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">القيمة (Code)</label>
                        <input 
                          type="text" 
                          required
                          value={newItem.value}
                          onChange={e => setNewItem({...newItem, value: e.target.value})}
                          className="w-full p-2 border rounded bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none font-mono text-left"
                          placeholder="example_code"
                          dir="ltr"
                        />
                         <p className="text-xs text-gray-400 mt-1">يستعمل في قاعدة البيانات (لاتيني)</p>
                      </div>
                      <div>
                         <label className="block text-sm text-gray-600 mb-1">التسمية (Label)</label>
                        <input 
                          type="text" 
                          required
                          value={newItem.label}
                          onChange={e => setNewItem({...newItem, label: e.target.value})}
                          className="w-full p-2 border rounded bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                          placeholder="التسمية العربية"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className={`flex-1 text-white py-2 rounded font-bold transition-colors ${editingListValue ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-800 hover:bg-gray-900'}`}>
                            {editingListValue ? 'حفظ التغييرات' : 'إضافة'}
                        </button>
                        {editingListValue && (
                            <button 
                            type="button" 
                            onClick={handleCancelListEdit}
                            className="bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded hover:bg-gray-50"
                            >
                            إلغاء
                            </button>
                        )}
                      </div>
                    </form>
                  </div>
               </div>

               {/* Lists View */}
               <div className="lg:col-span-2 space-y-8">
                  {/* Bac List */}
                  <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                     <div className="bg-gray-50 p-4 border-b font-bold text-gray-700 flex justify-between">
                       <span>شعب البكالوريا</span>
                       <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{bacSpecialties.length} عنصر</span>
                     </div>
                     <table className="w-full text-right">
                       <thead className="bg-gray-50/50 border-b text-xs text-gray-500 uppercase">
                         <tr>
                           <th className="p-3">الرمز (Value)</th>
                           <th className="p-3">التسمية</th>
                           <th className="p-3 w-24 text-center">إجراءات</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y">
                          {bacSpecialties.map((item) => (
                            <tr key={item.value} className={`hover:bg-gray-50 ${editingListValue === item.value && listType === 'bacSpecialties' ? 'bg-orange-50/50' : ''}`}>
                              <td className="p-3 font-mono text-sm text-blue-600">{item.value}</td>
                              <td className="p-3 font-medium">{item.label}</td>
                              <td className="p-3 flex justify-center gap-2">
                                <button 
                                  onClick={() => handleEditListItem('bacSpecialties', item)}
                                  className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded transition-colors"
                                  title="تعديل"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteListItem('bacSpecialties', item.value)}
                                  className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors"
                                  title="حذف"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                       </tbody>
                     </table>
                  </div>

                   {/* Degrees List */}
                   <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                     <div className="bg-gray-50 p-4 border-b font-bold text-gray-700 flex justify-between">
                       <span>الشهادات العلمية</span>
                       <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{degrees.length} عنصر</span>
                     </div>
                     <table className="w-full text-right">
                       <thead className="bg-gray-50/50 border-b text-xs text-gray-500 uppercase">
                         <tr>
                           <th className="p-3">الرمز (Value)</th>
                           <th className="p-3">التسمية</th>
                           <th className="p-3 w-24 text-center">إجراءات</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y">
                          {degrees.map((item) => (
                            <tr key={item.value} className={`hover:bg-gray-50 ${editingListValue === item.value && listType === 'degrees' ? 'bg-orange-50/50' : ''}`}>
                              <td className="p-3 font-mono text-sm text-blue-600">{item.value}</td>
                              <td className="p-3 font-medium">{item.label}</td>
                              <td className="p-3 flex justify-center gap-2">
                                <button 
                                  onClick={() => handleEditListItem('degrees', item)}
                                  className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded transition-colors"
                                  title="تعديل"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteListItem('degrees', item.value)}
                                  className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors"
                                  title="حذف"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                       </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}

          {/* --- TAB: POSITIONS --- */}
          {activeTab === 'positions' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
                  {/* Add/Edit Form */}
                  <div className="lg:col-span-1">
                      <div className={`p-6 rounded-xl border sticky top-6 transition-all ${editingCode ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                          <h3 className={`font-bold mb-4 flex items-center gap-2 ${editingCode ? 'text-orange-900' : 'text-gray-800'}`}>
                              {editingCode ? <Edit2 size={20} /> : <Plus size={20} />}
                              {editingCode ? 'تعديل الخطة' : 'إضافة خطة جديدة'}
                          </h3>
                          <form onSubmit={handlePositionSubmit} className="space-y-4">
                              <div>
                                  <label className="block text-sm text-gray-600 mb-1">رقم الخطة (Code)</label>
                                  <input 
                                      type="text" 
                                      required
                                      value={newPos.code}
                                      onChange={e => setNewPos({...newPos, code: e.target.value})}
                                      className="w-full p-2 border rounded bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none font-mono"
                                      placeholder="مثال: 105"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm text-gray-600 mb-1">اسم الخطة</label>
                                  <input 
                                      type="text" 
                                      required
                                      value={newPos.title}
                                      onChange={e => setNewPos({...newPos, title: e.target.value})}
                                      className="w-full p-2 border rounded bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                                      placeholder="مثال: عون إداري"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm text-gray-600 mb-1">عدد الخطط المفتوحة</label>
                                  <input 
                                      type="number"
                                      min="1"
                                      required
                                      value={newPos.openPositions}
                                      onChange={e => setNewPos({...newPos, openPositions: Number(e.target.value)})}
                                      className="w-full p-2 border rounded bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                                      placeholder="مثال: 5"
                                  />
                              </div>
                              <div className="flex gap-2">
                                <button type="submit" className={`flex-1 text-white py-2 rounded font-bold transition-colors ${editingCode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-800 hover:bg-gray-900'}`}>
                                    {editingCode ? 'حفظ التغييرات' : 'إضافة'}
                                </button>
                                {editingCode && (
                                  <button 
                                    type="button" 
                                    onClick={handleCancelEdit}
                                    className="bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded hover:bg-gray-50"
                                  >
                                    إلغاء
                                  </button>
                                )}
                              </div>
                          </form>
                      </div>
                  </div>

                  {/* List */}
                  <div className="lg:col-span-2">
                      <h3 className="font-bold text-gray-800 mb-4">الخطط المفتوحة للتناظر ({positions.length})</h3>
                      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-right">
                              <thead className="bg-gray-50 border-b">
                                  <tr>
                                      <th className="p-4">الرمز</th>
                                      <th className="p-4">اسم الخطة</th>
                                      <th className="p-4">عدد الخطط</th>
                                      <th className="p-4 w-28 text-center">إجراءات</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y">
                                  {positions.map(pos => (
                                      <tr key={pos.code} className={`hover:bg-gray-50 transition-colors ${editingCode === pos.code ? 'bg-orange-50/50' : ''}`}>
                                          <td className="p-4 font-mono font-bold text-primary-700">{pos.code}</td>
                                          <td className="p-4">{pos.title}</td>
                                          <td className="p-4 font-bold text-gray-700">{pos.openPositions}</td>
                                          <td className="p-4 flex justify-center gap-2">
                                              <button 
                                                  onClick={() => handleEditPosition(pos)}
                                                  className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded transition-colors"
                                                  title="تعديل"
                                              >
                                                  <Edit2 size={18} />
                                              </button>
                                              <button 
                                                  onClick={() => handleDeletePosition(pos.code)}
                                                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                                                  title="حذف"
                                              >
                                                  <Trash2 size={18} />
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                                  {positions.length === 0 && (
                                      <tr>
                                          <td colSpan={4} className="p-8 text-center text-gray-400">لا توجد خطط مسجلة</td>
                                      </tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}

          {/* --- TAB: CANDIDATES (DEFAULT) --- */}
          {activeTab === 'candidates' && (
             <div className="animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-lg font-bold text-gray-800">معالجة الترشحات</h2>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleValidateAllPending}
                            className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                        >
                            <CheckCircle size={14} />
                            <span>قبول جميع الملفات المتبقية (Validé)</span>
                        </button>
                    </div>
                </div>
                
                {candidates.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium">لا توجد ترشحات مسجلة حتى الآن</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                        <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                            <th className="py-4 px-4 font-bold">الرتبة</th>
                            <th className="py-4 px-4 font-bold">المجموع (S)</th>
                            <th className="py-4 px-4 font-bold">المترشح</th>
                            <th className="py-4 px-4 font-bold">الخطة</th>
                            <th className="py-4 px-4 font-bold">الوضعية الحالية</th>
                            <th className="py-4 px-4 font-bold text-center">إجراءات المعالجة</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {sortedCandidates.map((candidate, index) => {
                            const score = db.calculateScore(candidate, scoreConfig);
                            const positionName = db.getPositionByCode(candidate.targetPositionNumber)?.title || candidate.targetPositionNumber;
                            return (
                            <tr key={candidate.id} className="hover:bg-blue-50/50 transition-colors">
                            <td className="py-4 px-4">
                                <span className={`
                                inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                                ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                    index === 1 ? 'bg-gray-200 text-gray-700' : 
                                    index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-50 text-gray-500'}
                                `}>
                                {index + 1}
                                </span>
                            </td>
                            <td className="py-4 px-4">
                                <span className="text-lg font-bold text-blue-700">{score.toFixed(3)}</span>
                            </td>
                            <td className="py-4 px-4">
                                <div className="font-bold text-gray-900">{candidate.fullName}</div>
                                <div className="text-xs text-gray-500">{candidate.email}</div>
                            </td>
                             <td className="py-4 px-4">
                                <div className="text-sm font-medium bg-gray-100 px-2 py-1 rounded text-center">
                                    {positionName}
                                </div>
                            </td>
                            <td className="py-4 px-4">
                                {candidate.status === 'accepted' && <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">مقبول (Validé)</span>}
                                {candidate.status === 'rejected' && <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded">مرفوض</span>}
                                {candidate.status === 'pending' && <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded">في الانتظار</span>}
                            </td>
                            <td className="py-4 px-4">
                                <div className="flex items-center justify-center gap-2">
                                <button 
                                    onClick={() => setSelectedCandidate(candidate)}
                                    className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors" 
                                    title="عاين التفاصيل"
                                >
                                    <Eye size={18} />
                                </button>
                                
                                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                                {candidate.status === 'pending' && (
                                  <>
                                    <button 
                                        onClick={() => handleAcceptCandidate(candidate.id)}
                                        className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors" 
                                        title="قبول الملف (Validé)"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleRejectCandidate(candidate.id)}
                                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors" 
                                        title="رفض (غير مطابق)"
                                    >
                                        <X size={18} />
                                    </button>
                                  </>
                                )}
                                {candidate.status !== 'pending' && (
                                    <button 
                                        onClick={() => {
                                            db.updateStatus(candidate.id, 'pending');
                                            refreshData();
                                        }}
                                        className="text-xs text-gray-400 hover:text-gray-600 underline"
                                    >
                                        إعادة تعيين
                                    </button>
                                )}
                                </div>
                            </td>
                            </tr>
                        )})}
                        </tbody>
                    </table>
                    </div>
                )}
             </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCandidate.fullName}</h2>
                <p className="text-sm text-gray-500">رقم الملف: {selectedCandidate.id.toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="bg-blue-50 px-4 py-1 rounded-lg border border-blue-100 text-center">
                    <span className="block text-xs text-blue-600">المجموع الشخصي</span>
                    <span className="block font-bold text-blue-800">{db.calculateScore(selectedCandidate, scoreConfig).toFixed(3)}</span>
                 </div>
                <button 
                    onClick={() => setSelectedCandidate(null)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                    <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-8">
              
              {/* Personal Info */}
              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-primary-700 mb-4 pb-2 border-b border-primary-100">
                  <User size={20} />
                  المعطيات الشخصية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <InfoRow label="رقم ب.ت.و" value={selectedCandidate.cin} />
                  <InfoRow label="تاريخ الإصدار" value={selectedCandidate.cinDate} />
                  <InfoRow label="الجنس" value={getLabel(selectedCandidate.gender)} />
                  <InfoRow label="تاريخ الولادة" value={selectedCandidate.birthDate} />
                  <InfoRow label="مكان الولادة" value={selectedCandidate.birthPlace} />
                  <InfoRow label="العنوان" value={selectedCandidate.address} />
                  <InfoRow label="الولاية" value={selectedCandidate.governorate} />
                  <InfoRow label="الترقيم البريدي" value={selectedCandidate.postalCode} />
                  <InfoRow label="الهاتف" value={selectedCandidate.mobile} />
                  <InfoRow label="البريد الإلكتروني" value={selectedCandidate.email} />
                  <InfoRow label="التغطية الاجتماعية" value={getLabel(selectedCandidate.socialSecurityType)} />
                  {selectedCandidate.cnssNumber && (
                    <InfoRow label="رقم الانخراط" value={selectedCandidate.cnssNumber} />
                  )}
                </div>
              </section>

              {/* Civil Status */}
              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-primary-700 mb-4 pb-2 border-b border-primary-100">
                  <Heart size={20} />
                  الحالة الاجتماعية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <InfoRow label="الحالة المدنية" value={getLabel(selectedCandidate.maritalStatus)} />
                  <InfoRow label="الوضعية العسكرية" value={getLabel(selectedCandidate.militaryStatus)} />
                  {selectedCandidate.maritalStatus === 'married' && (
                    <>
                      <InfoRow label="اسم القرين" value={selectedCandidate.spouseName} />
                      <InfoRow label="مهنة القرين" value={selectedCandidate.spouseProfession} />
                      <InfoRow label="مكان عمل القرين" value={selectedCandidate.spouseWorkplace} />
                      <InfoRow label="عدد الأبناء" value={selectedCandidate.childrenCount} />
                    </>
                  )}
                </div>
              </section>

              {/* Education */}
              <section>
                <h3 className="flex items-center gap-2 text-lg font-bold text-primary-700 mb-4 pb-2 border-b border-primary-100">
                  <BookOpen size={20} />
                  المستوى التعليمي والخطة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                   <div className="col-span-1 md:col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <span className="text-gray-500 block text-xs mb-1">الخطة المطلوبة</span>
                      <span className="font-bold text-lg text-blue-800">
                        {db.getPositionByCode(selectedCandidate.targetPositionNumber)?.title || selectedCandidate.targetPositionNumber} 
                        <span className="text-sm font-normal text-gray-500 mx-2">({selectedCandidate.targetPositionNumber})</span>
                      </span>
                   </div>
                  <InfoRow label="الشهادة العلمية" value={getDynamicLabel('degree', selectedCandidate.degree)} />
                  <InfoRow label="الاختصاص" value={selectedCandidate.specialty} />
                  <InfoRow label="سنة التخرج" value={selectedCandidate.graduationYear} />
                  {selectedCandidate.equivalenceDecision && (
                    <>
                      <InfoRow label="رقم المعادلة" value={selectedCandidate.equivalenceDecision} />
                      <InfoRow label="تاريخ المعادلة" value={selectedCandidate.equivalenceDate} />
                    </>
                  )}
                  <InfoRow label="معدل البكالوريا" value={selectedCandidate.bacAverage} />
                  <InfoRow label="شعبة البكالوريا" value={getDynamicLabel('bac', selectedCandidate.bacSpecialty)} />
                  <InfoRow label="معدل التخرج" value={selectedCandidate.gradAverage} />
                </div>
              </section>

            </div>

            <div className="bg-gray-50 p-4 border-t flex justify-between items-center">
               <div className="text-xs text-gray-400">
                    حالة الملف الحالية: {selectedCandidate.status === 'accepted' ? 'مقبول' : selectedCandidate.status === 'rejected' ? 'مرفوض' : 'قيد المعالجة'}
               </div>
               <div className="flex gap-2">
                 {selectedCandidate.status === 'pending' && (
                    <>
                        <button onClick={() => {handleRejectCandidate(selectedCandidate.id); setSelectedCandidate(null)}} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-bold">رفض</button>
                        <button onClick={() => {handleAcceptCandidate(selectedCandidate.id); setSelectedCandidate(null)}} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold">قبول (Valider)</button>
                    </>
                 )}
                 <button 
                    onClick={() => setSelectedCandidate(null)}
                    className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                 >
                    إغلاق
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const InfoRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 mb-1">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
};
