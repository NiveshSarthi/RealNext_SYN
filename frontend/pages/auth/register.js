import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  LockClosedIcon,
  SparklesIcon,
  ShieldCheckIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessName: '',
    whatsappNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        company_name: formData.businessName,
        phone: formData.whatsappNumber,
        password: formData.password
      });

      if (result.success) {
        toast.success('Account created successfully!');
        router.push('/dashboard');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const passwordStrength = (password) => {
    if (password.length === 0) return { score: 0, label: '', color: 'bg-gray-800' };
    if (password.length < 6) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (password.length < 8) return { score: 2, label: 'Fair', color: 'bg-yellow-500' };
    if (password.length < 12) return { score: 3, label: 'Good', color: 'bg-blue-500' };
    return { score: 4, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = passwordStrength(formData.password);

  return (
    <div className="min-h-screen bg-[#07090D] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-primary/30">
      {/* Immersive Background Mesh (Shared with Login) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grain-gradient.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay"></div>
        <motion.div
          animate={{
            x: [0, -100, 50, 0],
            y: [0, 50, -100, 0],
            rotate: [0, -90, -180, 0],
            scale: [1, 1.2, 0.8, 1]
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[20%] w-[1000px] h-[1000px] bg-purple-600/20 blur-[180px] rounded-full mix-blend-screen"
        ></motion.div>
        <motion.div
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -100, 50, 0],
            rotate: [0, 90, 180, 0],
            scale: [1, 1.3, 0.9, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[20%] w-[1100px] h-[1100px] bg-primary/20 blur-[180px] rounded-full mix-blend-screen"
        ></motion.div>
      </div>

      <div className="w-full max-w-2xl relative z-10 my-16">
        {/* Premium Back Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex justify-center"
        >
          <Link href="/" className="group flex items-center space-x-3 px-6 py-2 rounded-full border border-white/5 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-white/10 transition-all duration-300">
            <ArrowLeftIcon className="h-4 w-4 text-gray-500 group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-black text-gray-500 group-hover:text-white uppercase tracking-[0.4em]">Return to Core</span>
          </Link>
        </motion.div>

        {/* Extreme Glass Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute -inset-[1px] bg-gradient-to-br from-white/20 via-transparent to-primary/20 rounded-[4rem] p-[1px] opacity-50"></div>

          <div className="relative bg-[#0E1117]/80 backdrop-blur-[120px] rounded-[4rem] shadow-[0_0_100px_-20px_rgba(0,0,0,0.8)] p-12 md:p-20 border border-white/10 overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

            <div className="relative z-10">
              {/* Branding Section */}
              <div className="text-center mb-16">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: -5 }}
                  className="mx-auto h-20 w-20 bg-gradient-to-br from-primary via-orange-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-[0_0_60px_-10px_rgba(255,122,0,0.6)] mb-10 p-0.5"
                >
                  <div className="w-full h-full bg-[#0E1117] rounded-[1.4rem] flex items-center justify-center">
                    <IdentificationIcon className="h-10 w-10 text-primary" />
                  </div>
                </motion.div>
                <h1 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase leading-none">Create Account</h1>
                <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.6em] opacity-60">
                  Join the RealNext Network
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid md:grid-cols-2 gap-10">
                  <InputField
                    id="name"
                    label="Full Name"
                    icon={UserIcon}
                    placeholder="Your Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  <InputField
                    id="email"
                    label="Email Address"
                    icon={EnvelopeIcon}
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                  <InputField
                    id="businessName"
                    label="Business Name"
                    icon={BuildingOfficeIcon}
                    placeholder="Your Business Name"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                  />
                  <InputField
                    id="whatsappNumber"
                    label="WhatsApp Number"
                    icon={PhoneIcon}
                    type="tel"
                    placeholder="Your WhatsApp Number"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label htmlFor="password" className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Password</label>
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors">
                        <LockClosedIcon className="h-5 w-5" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-7 py-5 pl-16 pr-16 text-sm text-white placeholder-gray-700 outline-none hover:bg-white/[0.05] focus:bg-white/[0.08] focus:border-primary/40 focus:ring-[6px] focus:ring-primary/5 transition-all duration-500"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                    {/* Strength Meter */}
                    <AnimatePresence>
                      {formData.password && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 space-y-2 px-4"
                        >
                          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.3em]">
                            <span className="text-gray-600">Password Strength</span>
                            <span className={strength.score > 2 ? 'text-green-500' : 'text-gray-700'}>{strength.label}</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(strength.score / 4) * 100}%` }}
                              className={`h-full transition-all duration-500 ${strength.color}`}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="confirmPassword" className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Confirm Password</label>
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors">
                        <CheckCircleIcon className="h-5 w-5" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-7 py-5 pl-16 pr-16 text-sm text-white placeholder-gray-700 outline-none hover:bg-white/[0.05] focus:bg-white/[0.08] focus:border-primary/40 focus:ring-[6px] focus:ring-primary/5 transition-all duration-500"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center text-[8px] font-black uppercase tracking-[0.3em] text-green-500 mt-4 px-4"
                      >
                        <ShieldCheckIcon className="h-3 w-3 mr-2" /> Passwords Match
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-4 pt-4 px-4">
                  <div className="relative flex items-center h-5">
                    <input
                      id="terms"
                      type="checkbox"
                      required
                      className="h-5 w-5 rounded-lg border-white/10 bg-white/5 text-primary focus:ring-primary/20 focus:ring-offset-0 transition-all cursor-pointer"
                    />
                  </div>
                  <label htmlFor="terms" className="text-[9px] font-bold text-gray-600 leading-relaxed uppercase tracking-widest max-w-sm">
                    Adhere strictly to <a href="#" className="text-primary hover:text-white transition-colors">Neural Protocols</a> & <a href="#" className="text-primary hover:text-white transition-colors">Privacy Bounds</a>.
                  </label>
                </div>

                <div className="pt-10">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative w-full h-20 rounded-3xl overflow-hidden group shadow-[0_25px_50px_-15px_rgba(255,122,0,0.3)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-orange-500 to-purple-600 group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center justify-center space-x-4 text-black font-black text-sm uppercase tracking-[0.4em]">
                      {loading ? (
                        <>
                          <div className="h-6 w-6 border-[3px] border-black/20 border-t-black rounded-full animate-spin"></div>
                          <span>Provisioning...</span>
                        </>
                      ) : (
                        <>
                          <span>Finalize Enrollment</span>
                          <SparklesIcon className="h-6 w-6" />
                        </>
                      )}
                    </div>
                  </motion.button>
                </div>
              </form>

              <div className="mt-20 text-center border-t border-white/5 pt-16">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 opacity-50">
                  Instance already initialized?
                </p>
                <Link href="/auth/login" className="group text-primary hover:text-white transition-all duration-300">
                  <span className="text-[11px] font-black uppercase tracking-[0.5em] border-b border-primary/20 group-hover:border-white group-hover:tracking-[0.6em] transition-all">Begin Synchronization</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        ::placeholder { color: #374151; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; font-size: 10px; }
      `}</style>
    </div>
  );
}

function InputField({ id, label, type = "text", placeholder, value, onChange, required, icon: Icon }) {
  return (
    <div className="space-y-3">
      <label htmlFor={id} className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">{label}</label>
      <div className="relative group">
        {Icon && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors duration-500">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <input
          id={id}
          name={id}
          type={type}
          required={required}
          className={`w-full bg-white/[0.03] border border-white/5 rounded-2xl px-7 py-5 ${Icon ? 'pl-16' : ''} text-sm text-white placeholder-gray-700 outline-none hover:bg-white/[0.05] focus:bg-white/[0.08] focus:border-primary/40 focus:ring-[6px] focus:ring-primary/5 transition-all duration-500`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  )
}
