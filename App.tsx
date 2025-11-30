import React, { useState } from 'react';
import { RecruitmentForm } from './RecruitmentForm';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';
import { CandidatePortal } from './components/CandidatePortal';
import { StoredCandidate } from './utils/storage';
import { LayoutDashboard, FileText, UserCircle } from 'lucide-react';

type View = 'form' | 'admin' | 'login' | 'candidate-portal';

const App: React.FC = () => {
  const [view, setView] = useState<View>('form');
  const [currentUser, setCurrentUser] = useState<StoredCandidate | null>(null);

  const handleLoginSuccess = (user: StoredCandidate) => {
    setCurrentUser(user);
    setView('candidate-portal');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Navbar */}
        <div className="mb-8 flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="w-10 h-10 bg-primary-700 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    ج
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">بوابة المناظرات الوطنية</h1>
                    <p className="text-xs text-gray-500">الجمهورية التونسية</p>
                </div>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end">
              <button 
                onClick={() => setView('form')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${view === 'form' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <FileText size={18} />
                <span className="hidden md:inline">استمارة الترشح</span>
              </button>

              <button 
                onClick={() => setView(currentUser ? 'candidate-portal' : 'login')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${(view === 'login' || view === 'candidate-portal') ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <UserCircle size={18} />
                <span className="hidden md:inline">فضاء المترشح</span>
              </button>

              <button 
                onClick={() => setView('admin')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${view === 'admin' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <LayoutDashboard size={18} />
                <span className="hidden md:inline">الإدارة (Admin)</span>
              </button>
            </div>
        </div>
        
        {view === 'form' && <RecruitmentForm />}
        {view === 'admin' && <AdminDashboard />}
        {view === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
        {view === 'candidate-portal' && currentUser && (
          <CandidatePortal candidate={currentUser} onLogout={handleLogout} />
        )}
        
        <footer className="mt-12 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} جميع الحقوق محفوظة - بوابة المناظرات</p>
        </footer>
      </div>
    </div>
  );
};

export default App;