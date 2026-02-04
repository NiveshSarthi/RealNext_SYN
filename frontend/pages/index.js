import Link from 'next/link';
import {
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  ChartBarIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon,
  ShieldCheckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0E1117] text-white font-sans selection:bg-primary/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 blur-[120px] rounded-full opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/10 blur-[100px] rounded-full opacity-20"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-header border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-glow-sm">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-black" />
            </div>
            <span className="text-xl font-bold font-display tracking-tight text-white flex items-center">
              RealNe<span className="text-2xl text-primary -ml-0.5">X</span>
              <span className="text-gray-500 text-xs ml-2 font-normal">CRM</span>
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
            <Link href="/auth/login" className="text-white hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link href="/auth/register">
              <Button variant="primary" className="px-6 py-2 rounded-full">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-semibold mb-8 animate-fade-in backdrop-blur-sm">
            <StarIcon className="h-3 w-3 mr-2" />
            Next-gen real estate automation
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            The gravity of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">intelligent sales.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Eliminate friction in your property funnel. Automate WhatsApp conversations,
            score leads with AI, and manage site visits from a weightless, dark-mode command center.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center mb-16">
            <Link href="/auth/register">
              <Button variant="primary" className="h-14 px-8 text-base rounded-full shadow-glow">
                Start Free Trial
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" className="h-14 px-8 text-base rounded-full border-white/10 hover:bg-white/5 text-white">
                View Demo
              </Button>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm rounded-2xl">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">2.5M+</div>
              <div className="text-[10px] text-gray-500 font-medium mt-1">PROPERTIES SOLD</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">98%</div>
              <div className="text-[10px] text-gray-500 font-medium mt-1">RESPONSE RATE</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">10k+</div>
              <div className="text-[10px] text-gray-500 font-medium mt-1">ACTIVE AGENTS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">ZERO</div>
              <div className="text-[10px] text-gray-500 font-medium mt-1">DOWNTIME</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Engineered for velocity
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Every tool you need to accelerate your real estate pipeline, unified in one fluid interface.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={ChatBubbleLeftRightIcon}
              title="WhatsApp Automation"
              desc="Instant responses. Drip campaigns. Automated follow-ups. Never lose a lead to delay again."
            />
            <FeatureCard
              icon={CpuChipIcon}
              title="AI Lead Scoring"
              desc="Our neural engine ranks leads by intent, matching buyers to properties with 94% accuracy."
            />
            <FeatureCard
              icon={BuildingStorefrontIcon}
              title="Smart Catalog"
              desc="Manage inventory with spatial clarity. Share PDF brochures and virtual tours in one click."
            />
            <FeatureCard
              icon={ChartBarIcon}
              title="Real-Time Analytics"
              desc="Visualize pipeline health, agent performance, and revenue forecasts with granular precision."
            />
            <FeatureCard
              icon={ShieldCheckIcon}
              title="Document Vault"
              desc="Bank-grade security for contracts, deeds, and KYC documents. Organized and searchable."
            />
            <FeatureCard
              icon={UserGroupIcon}
              title="Team Command"
              desc="Assign leads, track field visits, and monitor calls. Keep your entire sales force in sync."
            />
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-5xl mx-auto bg-gradient-to-b from-[#161B22] to-black border border-white/10 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to defy gravity?
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Join the elite real estate teams scaling effortlessly with SyndiTech.
          </p>
          <Link href="/auth/register">
            <Button variant="primary" className="h-16 px-10 text-lg rounded-full shadow-glow w-full md:w-auto">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center opacity-60 text-sm">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="h-6 w-6 bg-primary rounded-md flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="h-4 w-4 text-black" />
            </div>
            <span className="font-bold text-white tracking-tight flex items-center">
              RealNe<span className="text-lg text-primary -ml-0.5">X</span>
            </span>
          </div>
          <div className="flex gap-8 text-gray-400">
            <a href="#" className="hover:text-primary">Privacy</a>
            <a href="#" className="hover:text-primary">Terms</a>
            <a href="#" className="hover:text-primary">Contact</a>
          </div>
          <div className="mt-4 md:mt-0 text-gray-500">
            &copy; 2026 RealNex CRM.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="p-8 rounded-2xl bg-[#161B22]/50 border border-white/5 hover:border-primary/30 hover:bg-[#161B22] transition-all duration-300 group">
      <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-black group-hover:border-primary transition-colors text-gray-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm">
        {desc}
      </p>
    </div>
  );
}