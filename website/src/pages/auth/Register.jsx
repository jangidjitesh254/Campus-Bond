import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  Lock,
  GraduationCap,
  Calendar,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Info,
} from 'lucide-react';

const VGU_EMAIL_REGEX = /^[0-9]{2}[a-z0-9]{6,14}$/i;

export default function Register() {
  const { register, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  // Wizard step: 1 = Details, 2 = OTP Verification
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    branch: 'CSE',
    semester: 1,
  });
  const [otpCode, setOtpCode] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Step 1: Submit details -> Request OTP
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail.endsWith('@vgu.ac.in')) {
      setError('Registration is restricted to official @vgu.ac.in campus emails.');
      return;
    }

    const localPart = cleanEmail.split('@')[0];
    if (!VGU_EMAIL_REGEX.test(localPart)) {
      setError(
        'Invalid college email ID. It must begin with your 2-digit admission year followed by your student roll code (e.g. 21bcon101@vgu.ac.in).'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await register({ ...formData, email: cleanEmail });
      setInfoMessage(
        res?.message || `A 6-digit verification code has been sent to ${cleanEmail}.`
      );
      if (res?.devOtp) {
        setOtpCode(res.devOtp);
      }
      setCooldown(60);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check the provided information.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit OTP code -> Complete Registration
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyOtp(formData.email.trim().toLowerCase(), otpCode);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');
    setResending(true);
    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const res = await resendOtp(cleanEmail);
      setInfoMessage(res?.message || 'A fresh code has been emailed to your university account.');
      if (res?.devOtp) {
        setOtpCode(res.devOtp);
      }
      setCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-xl relative overflow-hidden text-gray-900">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 text-gray-950 mb-4 shadow-sm">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-gray-950 tracking-tight">
            {step === 1 ? 'Create VGU Student Account' : 'Verify University Email'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1
              ? 'Join the verified Vivek Global University student community'
              : `Enter the 6-digit code sent to ${formData.email}`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-600 text-sm font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && step === 2 && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-700 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jitesh Jangir"
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0B1528] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                VGU Student Email (@vgu.ac.in)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="21bcon101@vgu.ac.in"
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0B1528] transition-all"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span>Must be your official VGU email (e.g. 21bcon101@vgu.ac.in). Starts with 2-digit batch year.</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0B1528] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Branch / Major
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#0B1528] transition-all cursor-pointer font-medium"
                  >
                    <option value="CSE">CSE</option>
                    <option value="AI & DS">AI & DS</option>
                    <option value="ECE">ECE</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                    <option value="Management">Management (BBA/MBA)</option>
                    <option value="Design">Design (B.Des)</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Semester
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#0B1528] transition-all cursor-pointer font-medium"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 px-4 bg-[#0B1528] hover:bg-black text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs leading-relaxed">
              <p className="font-bold mb-1">📩 Verification Code Dispatched</p>
              <p>We've sent a 6-digit OTP from <strong>noreply@shadowbiz.in</strong> to <strong>{formData.email}</strong>. Please check your inbox and Spam folder.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">
                6-Digit Verification Code
              </label>
              <div className="relative max-w-xs mx-auto">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.trim())}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] font-mono text-xl py-3.5 pl-10 pr-4 bg-white border-2 border-gray-200 rounded-xl text-gray-950 font-bold focus:outline-none focus:border-[#0B1528] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full py-3.5 px-4 bg-[#0B1528] hover:bg-black text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer active:scale-98"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify & Create Account</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-gray-500 hover:text-black transition-colors cursor-pointer font-medium"
              >
                ← Back to Edit Details
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="flex items-center gap-1.5 text-gray-900 font-bold hover:underline disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}</span>
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#0B1528] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
