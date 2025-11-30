import React, { useState } from 'react';
import { db, StoredCandidate } from '../utils/storage';
import { InputGroup } from './InputGroup';
import { LogIn, AlertCircle, KeyRound, Mail, Check, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (candidate: StoredCandidate) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'forgot'>('login');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Recovery State
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [simulatedEmail, setSimulatedEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = db.login(email, password);
    
    if (user) {
      onLoginSuccess(user);
    } else {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
    setIsLoading(false);
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryStatus('idle');
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newPass = db.resetPassword(recoveryEmail);
    
    if (newPass) {
        setRecoveryStatus('success');
        setSimulatedEmail(newPass);
    } else {
        setRecoveryStatus('error');
    }
    setIsLoading(false);
  };

  if (view === 'forgot') {
      return (
        <div className="max-w-md mx-auto mt-10">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <KeyRound className="w-8 h-8 text-orange-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">استرجاع كلمة المرور</h2>
                    <p className="text-gray-500 mt-2 text-sm">أدخل بريدك الإلكتروني لاستلام كلمة مرور جديدة</p>
                </div>

                {recoveryStatus === 'success' ? (
                     <div className="text-center animate-fadeIn">
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200 mb-6">
                            <Check className="mx-auto text-green-600 mb-2" size={32} />
                            <h3 className="font-bold text-green-800">تم الإرسال بنجاح!</h3>
                            <p className="text-sm text-green-700 mt-1">تفقد بريدك الإلكتروني للحصول على كلمة المرور الجديدة.</p>
                        </div>
                        
                        {/* Simulation Box */}
                        <div className="bg-gray-800 text-white p-4 rounded-lg mb-6 text-right relative overflow-hidden" dir="ltr">
                             <div className="absolute top-0 right-0 bg-yellow-500 text-xs text-black font-bold px-2 py-0.5 rounded-bl">SIMULATION (Email Inbox)</div>
                             <div className="flex items-center gap-2 mb-2 border-b border-gray-600 pb-2">
                                <Mail size={16} />
                                <span className="font-bold text-sm">no-reply@concours.gov.tn</span>
                             </div>
                             <div className="text-sm space-y-2">
                                <p>Hello,</p>
                                <p>Your password has been reset successfully.</p>
                                <p>New Password: <span className="bg-white text-black px-2 py-0.5 rounded font-mono font-bold tracking-wider">{simulatedEmail}</span></p>
                             </div>
                        </div>

                        <button
                            onClick={() => {
                                setView('login');
                                setRecoveryStatus('idle');
                                setSimulatedEmail(null);
                            }}
                            className="w-full py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-black transition-colors"
                        >
                            العودة لتسجيل الدخول
                        </button>
                     </div>
                ) : (
                    <form onSubmit={handleRecovery}>
                        {recoveryStatus === 'error' && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-bold flex items-center gap-2">
                                <AlertCircle size={16} />
                                البريد الإلكتروني غير موجود في قاعدة البيانات
                            </div>
                        )}

                        <InputGroup
                            label="البريد الإلكتروني"
                            type="email"
                            value={recoveryEmail}
                            onChange={(e) => setRecoveryEmail(e.target.value)}
                            required
                            fullWidth
                            dir="ltr"
                            className="text-left"
                            placeholder="user@example.com"
                        />

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`
                                w-full mt-2 py-3 rounded-lg font-bold text-white shadow-md
                                transition-all duration-200
                                ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}
                            `}
                        >
                            {isLoading ? 'جاري الإرسال...' : 'إرسال كلمة المرور'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setView('login')}
                            className="w-full mt-4 py-2 text-gray-500 text-sm hover:text-gray-700 font-medium"
                        >
                            إلغاء والعودة
                        </button>
                    </form>
                )}
            </div>
        </div>
      )
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">فضاء المترشح</h2>
          <p className="text-gray-500 mt-2">الرجاء إدخال بيانات الدخول المرسلة عبر البريد</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <InputGroup
            label="البريد الإلكتروني"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            dir="ltr"
            className="text-left"
          />
          
          <div className="relative">
            <InputGroup
                label="كلمة المرور"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                dir="ltr"
                className="text-left"
            />
            <button 
                type="button"
                onClick={() => setView('forgot')}
                className="absolute top-0 left-0 text-xs text-primary-600 hover:underline font-bold"
            >
                نسيت كلمة المرور؟
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full mt-4 py-3 rounded-lg font-bold text-white shadow-md
              transition-all duration-200
              ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}
            `}
          >
            {isLoading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
};