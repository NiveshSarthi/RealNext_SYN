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
  EnvelopeIcon,
  LockClosedIcon,
  SparklesIcon,
  FingerPrintIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData);

      if (result.success) {
        toast.success('Access Granted');
        if (result.user?.is_super_admin) {
          router.push('/admin');
        } else if (result.user?.context?.partner) {
          router.push('/partner');
        } else {
          router.push('/dashboard');
        }
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Authentication failure. System check required.');
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

  return (
    <div className="min-h-screen bg-[#07090D] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-primary/30">
      {/* Immersive Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-[0.15] mix-blend-overlay"></div>

        {/* Animated Mesh Gradients */}
        <motion.div
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -50, 100, 0],
            rotate: [0, 90, 180, 0],
            scale: [1, 1.2, 0.8, 1]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -right-[20%] w-[1000px] h-[1000px] bg-primary/20 blur-[180px] rounded-full mix-blend-screen"
        ></motion.div>

        <motion.div
          animate={{
            x: [0, -100, 50, 0],
            y: [0, 100, -50, 0],
            rotate: [0, -90, -180, 0],
            scale: [1, 1.3, 0.9, 1]
          }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -left-[20%] w-[1100px] h-[1100px] bg-purple-600/20 blur-[180px] rounded-full mix-blend-screen"
        ></motion.div>
      </div>

      <div className="w-full max-w-lg relative z-10">
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
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="relative"
        >
          {/* Layered Borders & Shadows */}
          <div className="absolute -inset-[1px] bg-gradient-to-br from-white/20 via-transparent to-primary/20 rounded-[3.5rem] p-[1px] opacity-50"></div>

          <div className="relative bg-[#0E1117]/80 backdrop-blur-[120px] rounded-[3.5rem] shadow-[0_0_100px_-20px_rgba(0,0,0,0.8)] p-12 md:p-16 border border-white/10 overflow-hidden">
            {/* Subtle Patterns */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            <div className="relative z-10">
              {/* Branding Section */}
              <div className="text-center mb-16">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="mx-auto h-20 w-20 bg-gradient-to-br from-primary via-orange-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-[0_0_60px_-10px_rgba(255,122,0,0.6)] mb-10 p-0.5"
                >
                  <div className="w-full h-full bg-[#0E1117] rounded-[1.4rem] flex items-center justify-center">
                    <FingerPrintIcon className="h-10 w-10 text-primary" />
                  </div>
                </motion.div>
                <h1 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase leading-none">Welcome Back</h1>
                <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.5em] opacity-60">
                  Sign in to your account
                </p>
              </div>

              {/* Enhanced Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label htmlFor="email" className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4 opacity-80">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors duration-500">
                      <EnvelopeIcon className="h-5 w-5" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-7 py-5 pl-16 text-sm text-white placeholder-gray-700 outline-none hover:bg-white/[0.05] focus:bg-white/[0.08] focus:border-primary/40 focus:ring-[6px] focus:ring-primary/5 transition-all duration-500"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-4">
                    <label htmlFor="password" className="text-[10px] font-black text-gray-500 uppercase tracking-widest opacity-80">
                      Password
                    </label>
                    <Link href="/auth/forgot-password" title="Recover access" className="text-[10px] font-black text-primary/40 hover:text-primary transition-colors tracking-widest uppercase">
                      Lost Key?
                    </Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors duration-500">
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
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors duration-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-8">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative w-full h-[72px] rounded-2xl overflow-hidden group shadow-[0_20px_40px_-15px_rgba(255,122,0,0.3)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-orange-500 to-purple-600 group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center justify-center space-x-3 text-black font-black text-sm uppercase tracking-[0.3em]">
                      {loading ? (
                        <>
                          <div className="h-5 w-5 border-[3px] border-black/20 border-t-black rounded-full animate-spin"></div>
                          <span>Synthesizing...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify Access</span>
                          <SparklesIcon className="h-5 w-5" />
                        </>
                      )}
                    </div>
                  </motion.button>
                </div>
              </form>

              {/* Professional Footer */}
              <div className="mt-16 text-center border-t border-white/5 pt-12">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2 opacity-50">
                  Not registered in current node?
                </p>
                <Link href="/auth/register" className="group text-primary hover:text-white transition-all duration-300">
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] border-b border-primary/20 group-hover:border-white group-hover:tracking-[0.5em] transition-all">Initialize Enrollment</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* System Metadata */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 flex justify-center space-x-12"
        >
          {[
            { label: "Status", val: "Operational", color: "bg-green-500" },
            { label: "Enc", val: "AES-256", color: "bg-blue-500" },
            { label: "Loc", val: "Global Node", color: "bg-purple-500" }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className={`h-1.5 w-1.5 rounded-full ${item.color} mb-2 shadow-[0_0_8px_rgba(34,197,94,0.5)]`}></div>
              <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.4em]">{item.label}</span>
              <span className="text-[7px] font-bold text-gray-800 uppercase tracking-[0.2em] mt-1">{item.val}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <style jsx global>{`
        ::placeholder { color: #374151; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; font-size: 10px; }
      `}</style>
    </div>
  );
}
