import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon
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

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(formData.password)) {
      toast.error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
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
    if (password.length === 0) return { score: 0, label: '', color: '' };
    if (password.length < 6) return { score: 1, label: 'Weak', color: 'text-red-500' };
    if (password.length < 8) return { score: 2, label: 'Fair', color: 'text-yellow-500' };
    if (password.length < 12) return { score: 3, label: 'Good', color: 'text-blue-500' };
    return { score: 4, label: 'Strong', color: 'text-green-500' };
  };

  const strength = passwordStrength(formData.password);

  return (
    <div className="min-h-screen bg-[#0E1117] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-primary/30">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-500/10 blur-[120px] rounded-full opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/10 blur-[100px] rounded-full opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in my-8">
        {/* Back to Home */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-500 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-glow mb-6 text-black">
            <ChatBubbleLeftRightIcon className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create account</h1>
          <p className="text-gray-400">
            Join the automated real estate revolution
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#161B22]/80 backdrop-blur-md rounded-2xl shadow-soft border border-white/5 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              id="name"
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <InputField
              id="email"
              label="Email Address"
              type="email"
              placeholder="john@realestate.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <InputField
              id="businessName"
              label="Business Name"
              placeholder="Prime Properties Ltd."
              value={formData.businessName}
              onChange={handleChange}
              required
            />

            <div className="space-y-2">
              <label htmlFor="whatsappNumber" className="text-sm font-medium text-gray-300">WhatsApp Number</label>
              <div className="relative group">
                <input
                  id="whatsappNumber"
                  name="whatsappNumber"
                  type="tel"
                  required
                  className="w-full bg-[#0E1117] border border-white/10 rounded-lg px-4 py-3 pl-11 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  placeholder="+91 98765 43210"
                  value={formData.whatsappNumber}
                  onChange={handleChange}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
              <div className="relative group">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full bg-[#0E1117] border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>

              {/* Strength Meter */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Strength</span>
                    <span className={`${strength.color} font-medium`}>{strength.label}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.score === 1 ? 'bg-red-500 w-1/4' :
                        strength.score === 2 ? 'bg-yellow-500 w-2/4' :
                          strength.score === 3 ? 'bg-blue-500 w-3/4' :
                            'bg-green-500 w-full'
                        }`}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">Confirm Password</label>
              <div className="relative group">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="w-full bg-[#0E1117] border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="flex items-center text-xs text-green-500 mt-1">
                  <CheckCircleIcon className="h-3 w-3 mr-1" /> Match
                </div>
              )}
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <input
                id="terms"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#0E1117] text-primary focus:ring-primary/50 focus:ring-offset-0"
              />
              <label htmlFor="terms" className="text-xs text-gray-400 leading-relaxed">
                I agree to the{' '}
                <a href="#" className="text-primary hover:text-orange-400 transition-colors">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary hover:text-orange-400 transition-colors">Privacy Policy</a>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-semibold shadow-glow-sm mt-4"
              variant="primary"
            >
              {loading ? 'Creating Account...' : 'Start Free Trial'}
            </Button>
          </form>

          {/* Social Registration */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#161B22] text-gray-500">Or sign up with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="h-10 px-4 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#0E1117] hover:bg-white/5 hover:border-white/20 text-gray-300 transition-all text-sm font-medium">
                Google
              </button>
              <button className="h-10 px-4 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#0E1117] hover:bg-white/5 hover:border-white/20 text-gray-300 transition-all text-sm font-medium">
                Twitter
              </button>
            </div>
          </div>

          <div className="mt-8 text-center border-t border-white/5 pt-6">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:text-orange-400 transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ id, label, type = "text", placeholder, value, onChange, required }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-300">{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        className="w-full bg-[#0E1117] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}