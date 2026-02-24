import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  ChartBarIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon,
  CursorArrowRaysIcon,
  PresentationChartLineIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  GlobeAltIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

function MagneticButton({ children }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.3, y: middleY * 0.3 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Mouse tracking for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for tracking
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Parallax transforms for Hero Heading
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-10, 10]);
  const translateX = useTransform(smoothX, [-0.5, 0.5], [-20, 20]);
  const translateY = useTransform(smoothY, [-0.5, 0.5], [-20, 20]);

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const stats = [
    { label: 'LEADS MANAGED', value: '633+' },
    { label: 'DELIVERY RATE', value: '99.9%' },
    { label: 'TRUSTED TEAMS', value: '42+' },
    { label: 'AI ACCURACY', value: '94%' }
  ];

  const features = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: "WhatsApp Automation",
      desc: "Instant responses. Drip campaigns. Automated follow-ups. Never lose a lead to delay again.",
      color: "from-green-400 to-emerald-600"
    },
    {
      icon: CpuChipIcon,
      title: "AI Lead Scoring",
      desc: "Our neural engine ranks leads by intent, matching buyers to properties with hyper-precision.",
      color: "from-blue-400 to-indigo-600"
    },
    {
      icon: BuildingStorefrontIcon,
      title: "Smart Catalog",
      desc: "Manage inventory with spatial clarity. Share PDF brochures and virtual tours in one click.",
      color: "from-orange-400 to-red-600"
    }
  ];

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Lead Conversion %',
        data: [12, 19, 15, 25, 22, 30],
        borderColor: '#FF7A00',
        backgroundColor: 'rgba(255, 122, 0, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#FF7A00',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#161B22',
        titleColor: '#fff',
        bodyColor: '#9CA3AF',
        padding: 12,
        borderRadius: 8,
        displayColors: false
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#4B5563' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#4B5563' } }
    }
  };

  const faqs = [
    { q: "How does the WhatsApp automation work?", a: "RealNext connects directly to the Meta WhatsApp Business API. It allows you to set up automated drip sequences, quick replies, and AI-driven chatbots that handle initial qualifying questions before handing off to a human agent." },
    { q: "Can I import leads from Facebook Ads?", a: "Yes, we have deep integration with Facebook Lead Forms. Leads are pulled in real-time and can be automatically assigned to agents or entered into WhatsApp follow-up workflows instantly." },
    { q: "Is my data secure and isolated?", a: "Absolutely. We use a multi-tenant architecture with strict logical isolation at the database level. Each client's data is scoped to their specific ID and unreachable by others." },
    { q: "Do you support multiple languages for CRM?", a: "Currently, our interface is in English, but you can send WhatsApp messages and create templates in any language supported by UTF-8 (including Hindi, Arabic, Spanish, etc.)." }
  ];

  const comparison = [
    { feature: "Lead Sync Frequency", realnext: "Real-time (Instant)", legacy: "Hourly/Daily" },
    { feature: "WhatsApp Marketing", realnext: "Full API Integration", legacy: "None or 3rd Party" },
    { feature: "AI Lead Scoring", realnext: "Neural Intent Mapping", legacy: "Basic Rule-based" },
    { feature: "Client Isolation", realnext: "Tier-1 Multi-tenant", legacy: "Shared Schema" },
    { feature: "Inventory Management", realnext: "Interactive Catalog", legacy: "Static CSV/Excel" }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0E1117] text-white font-sans selection:bg-primary/30 overflow-x-hidden">
      {/* Background Video Ambience / Motion Particles */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Animated Video Placeholder Effect */}
        <div className="absolute inset-0 bg-[url('https://grain-gradient.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 via-transparent to-black/20 animate-pulse"></div>

        {/* Layered Floating Blobs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full"
        ></motion.div>
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-10%] w-[900px] h-[900px] bg-purple-600/10 blur-[150px] rounded-full"
        ></motion.div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-glow-sm">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-black" />
            </div>
            <span className="text-xl font-bold font-display tracking-tight text-white flex items-center uppercase">
              RealNex<span className="text-3xl text-primary -ml-1">T</span>
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#comparison" className="text-gray-400 hover:text-white transition-colors">Why Us?</a>
            <a href="#faq" className="text-gray-400 hover:text-white transition-colors">FAQ</a>
            <Link href="/auth/login" className="text-white hover:text-primary transition-colors">Sign In</Link>
            <Link href="/auth/register">
              <Button variant="primary" className="px-6 py-2 rounded-full text-black font-bold">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative pt-48 pb-20 px-6 z-10 flex flex-col items-center overflow-hidden"
      >
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="text-center w-full max-w-7xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-bold tracking-widest mb-8 backdrop-blur-sm uppercase cursor-default hover:bg-white/10 transition-colors"
          >
            <SparklesIcon className="h-3 w-3 mr-2 animate-spin-slow" />
            WhatsApp & LMS Suite 3.0
          </motion.div>

          <div className="perspective-1000">
            <motion.h1
              style={{
                rotateX,
                rotateY,
                x: translateX,
                y: translateY,
                transformStyle: "preserve-3d"
              }}
              className="text-7xl md:text-[10rem] font-black text-white mb-8 leading-[0.8] tracking-[-0.05em] select-none"
            >
              GROW WITHOUT <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-purple-500">FRICTION.</span>
            </motion.h1>
          </div>

          <motion.p {...fadeIn} transition={{ delay: 0.2 }} className="text-lg md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
            The high-octane engine for real estate dominance. <br />
            Automate, analyze, and scale at the speed of light.
          </motion.p>

          <div className="flex flex-col md:flex-row justify-center items-center gap-12">
            <MagneticButton>
              <Link href="/auth/register">
                <Button className="h-24 px-16 text-2xl rounded-[1.5rem] bg-primary text-black font-black hover:scale-105 hover:shadow-glow transition-all duration-300">
                  Start Scaling <ArrowRightIcon className="h-6 w-6 ml-3 inline-block" />
                </Button>
              </Link>
            </MagneticButton>

            <div className="flex items-center space-x-6 group">
              <div className="flex -space-x-4">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -8, scale: 1.2, zIndex: 10 }}
                    title={`Active User ${i}`}
                    className="h-14 w-14 rounded-2xl border-2 border-[#0E1117] bg-white/10 flex items-center justify-center text-[10px] font-black text-white/50 cursor-pointer backdrop-blur-md"
                  >
                    U{i}
                  </motion.div>
                ))}
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-white tracking-widest uppercase mb-1">Join 633+</div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Top Performers</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Dashboard Intelligence Preview */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative w-full max-w-6xl mx-auto perspective-1000 group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-[3rem] blur-3xl group-hover:opacity-100 opacity-60 transition duration-1000"></div>
        <div className="relative bg-[#161B22]/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
          <div className="h-12 bg-white/5 border-b border-white/5 flex items-center px-8 space-x-2">
            <div className="flex space-x-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/80"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80"></div>
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/80"></div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="h-5 w-64 bg-white/5 rounded-lg border border-white/5 flex items-center px-3">
                <GlobeAltIcon className="h-3 w-3 text-gray-600 mr-2" />
                <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">realnext.ai/dashboard</div>
              </div>
            </div>
          </div>

          <div className="p-10 md:p-16 grid md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <PresentationChartLineIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight uppercase">Performance Velocity</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Real-time Lead Insights</p>
                  </div>
                </div>
              </div>
              <div className="h-[350px] w-full">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-white/5 pb-4">Pulse Command</h3>
              {[
                { label: 'Active Automations', value: '42', icon: BoltIcon, color: 'text-yellow-400' },
                { label: 'Pipeline Value', value: '₹4.2Cr', icon: ChartBarIcon, color: 'text-primary' },
                { label: 'Response Time', value: '1.2s', icon: RocketLaunchIcon, color: 'text-blue-400' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.08)' }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/5 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.label}</div>
                  </div>
                  <div className="text-3xl font-black text-white tracking-tighter">{item.value}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feature Deep Dives */}
      <section id="features" className="py-20 z-10 relative">
        <div className="max-w-7xl mx-auto px-6 space-y-32">

          {/* Deep Dive 1 */}
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="h-14 w-14 bg-green-500/20 rounded-2xl flex items-center justify-center mb-8">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-5xl font-black text-white mb-6 uppercase tracking-tighter">WhatsApp Marketing <br /><span className="text-green-500">On Steroids.</span></h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                Stop missing leads in your inbox. Our deep Meta integration pulls leads instantly and triggers drip sequences that feel human, but scale like software.
              </p>
              <ul className="space-y-4">
                {['Broadcast to 10k+ contacts', 'Automated OTP verification', 'AI context responses'].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-300 font-bold text-sm uppercase tracking-tight">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" /> {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <div className="bg-[#161B22] rounded-[3rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="h-[400px] w-full bg-black/40 rounded-2xl flex items-center justify-center overflow-hidden">
                <motion.img
                  whileHover={{ scale: 1.05, rotateZ: 2 }}
                  src="/images/whatsapp_dashboard.png"
                  alt="WhatsApp Dashboard"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Deep Dive 2 */}
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div className="order-2 md:order-1 bg-[#161B22] rounded-[3rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="h-[400px] w-full bg-black/40 rounded-2xl flex items-center justify-center overflow-hidden">
                <motion.img
                  whileHover={{ scale: 1.05, rotateZ: -2 }}
                  src="/images/ai_leads_scoring.png"
                  alt="AI Leads Scoring"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 md:order-2"
            >
              <div className="h-14 w-14 bg-primary/20 rounded-2xl flex items-center justify-center mb-8">
                <CpuChipIcon className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-5xl font-black text-white mb-6 uppercase tracking-tighter">Neural Intent <br /><span className="text-primary">Lead Scoring.</span></h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                Our proprietary AI doesn't just list leads; it ranks them. By analyzing behavioral signals and conversation depth, we tell your agents exactly who to call first.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-primary font-black text-xl">94%</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Prediction Accuracy</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-white font-black text-xl">2.4x</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Closing Speed</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="comparison" className="py-32 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter">RealNext vs <span className="text-gray-600">The Rest.</span></h2>
            <p className="text-gray-500 font-bold uppercase text-xs tracking-[0.3em]">No Competition. Just Dominance.</p>
          </div>

          <div className="bg-[#161B22]/50 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="p-8 text-xs font-black text-gray-500 uppercase tracking-widest">Capability</th>
                  <th className="p-8 text-xs font-black text-primary uppercase tracking-widest">RealNext AI</th>
                  <th className="p-8 text-xs font-black text-gray-600 uppercase tracking-widest">Legacy CRM</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="p-8 text-sm font-bold text-gray-300 uppercase tracking-tight">{row.feature}</td>
                    <td className="p-8 text-sm font-black text-white">
                      <span className="flex items-center"><CheckCircleIcon className="h-4 w-4 text-primary mr-2" /> {row.realnext}</span>
                    </td>
                    <td className="p-8 text-sm text-gray-600">{row.legacy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-white mb-16 text-center uppercase tracking-tighter">Frequently <span className="text-primary">Defied.</span></h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => <FAQItem key={i} question={faq.q} answer={faq.a} />)}
          </div>
        </div>
      </section>

      {/* Refined Premium CTA with Decorative Elements */}
      <section className="py-40 px-6 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto bg-[#161B22]/80 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-16 md:p-32 text-center relative overflow-hidden group shadow-2xl"
        >
          {/* Decorative Dot Grid Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, #4B5563 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

          {/* Animated Background Pulse */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 blur-[120px] rounded-full group-hover:bg-primary/20 transition-colors duration-700"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/5 blur-[120px] rounded-full"></div>

          {/* Floating Decorative Icons (Filling Blank Space) */}
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-20 opacity-20 hidden lg:block"
          >
            <BuildingStorefrontIcon className="h-16 w-16 text-white" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -15, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-20 right-20 opacity-20 hidden lg:block"
          >
            <UserGroupIcon className="h-16 w-16 text-white" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 -right-10 opacity-10 hidden xl:block"
          >
            <SparklesIcon className="h-32 w-32 text-primary" />
          </motion.div>

          {/* Floating Status Pill */}
          <motion.div
            animate={{ x: [0, 15, 0] }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute top-40 right-40 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hidden lg:flex items-center space-x-3 shadow-xl"
          >
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Ready</span>
          </motion.div>

          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="h-20 w-20 bg-gradient-to-br from-primary to-orange-600 rounded-3xl mb-12 flex items-center justify-center shadow-glow"
            >
              <RocketLaunchIcon className="h-10 w-10 text-black" />
            </motion.div>

            <h2 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-none uppercase">
              REACH <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">VELOCITY.</span>
            </h2>

            <p className="text-gray-400 font-medium text-xl max-w-2xl mx-auto mb-16 uppercase tracking-widest leading-relaxed">
              Stop managing leads. Start dominating the market. <br />
              <span className="text-gray-600 text-sm">Join the next-gen property ecosystem.</span>
            </p>

            <div className="flex flex-col md:flex-row justify-center items-center gap-10">
              <Link href="/auth/register">
                <Button className="h-20 px-16 text-2xl rounded-2xl bg-primary text-black font-black hover:scale-110 hover:shadow-glow transition-all duration-300">
                  Launch Instance Now
                </Button>
              </Link>
              <div className="flex flex-col items-start text-left">
                <div className="flex items-center text-xs font-black text-white/40 uppercase tracking-[0.3em] mb-2">
                  <ShieldCheckIcon className="h-4 w-4 mr-2 text-primary" /> Instant Activation
                </div>
                <div className="flex items-center text-xs font-black text-white/40 uppercase tracking-[0.3em]">
                  <CheckCircleIcon className="h-4 w-4 mr-2 text-primary" /> No Credit Card
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-black/95 pt-24 pb-12 px-6 relative z-30 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-12 mb-20 uppercase font-bold text-[10px] tracking-widest text-gray-500">
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-8">
              <div className="h-8 w-8 bg-primary rounded-lg"></div>
              <span className="text-2xl font-black text-white tracking-tighter">RealNex<span className="text-primary">T</span></span>
            </div>
            <p className="max-w-xs leading-loose opacity-60">The next-generation ecosystem for real estate automation. Engineered for hyper-growth teams globally.</p>
          </div>
          <div className="flex flex-col space-y-4">
            <span className="text-white mb-4">Platform</span>
            {['LMS Core', 'WhatsApp Suite', 'AI Scoring', 'Catalog'].map(l => <a key={l} href="#" className="hover:text-primary transition-colors">{l}</a>)}
          </div>
          <div className="flex flex-col space-y-4">
            <span className="text-white mb-4">Resources</span>
            {['API Docs', 'Security', 'Integrations', 'Network'].map(l => <a key={l} href="#" className="hover:text-primary transition-colors">{l}</a>)}
          </div>
          <div className="flex flex-col space-y-4">
            <span className="text-white mb-4">Company</span>
            {['About', 'Contact', 'Legal', 'Privacy'].map(l => <a key={l} href="#" className="hover:text-primary transition-colors">{l}</a>)}
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[8px] font-black text-gray-700 tracking-[0.5em] uppercase">
          <div>&copy; 2026 RealNext &bull; Syndicate Global Ecosystem</div>
          <div className="mt-4 md:mt-0 flex space-x-8">
            <div className="flex items-center"><div className="h-1.5 w-1.5 bg-green-500 rounded-full mr-2"></div> System Online</div>
            <a href="#" className="hover:text-white transition-colors">Twitter (X)</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .shadow-glow { box-shadow: 0 0 50px -10px rgba(255, 122, 0, 0.5); }
        .shadow-glow-sm { box-shadow: 0 0 20px -5px rgba(255, 122, 0, 0.3); }
        .perspective-1000 { perspective: 1000px; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
      `}</style>
    </div >
  );
}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-white/5 rounded-2xl bg-[#161B22]/30 backdrop-blur-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <span className="text-sm font-bold text-white uppercase tracking-tight">{question}</span>
        <ChevronDownIcon className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-6"
          >
            <p className="text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}