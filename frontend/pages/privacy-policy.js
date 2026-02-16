import Link from 'next/link';
import { ChatBubbleLeftRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#0E1117] text-white font-sans selection:bg-primary/30">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[120px] rounded-full opacity-20"></div>
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/5 blur-[100px] rounded-full opacity-20"></div>
            </div>

            {/* Navigation (Simplified) */}
            <nav className="fixed top-0 w-full z-50 glass-header border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="h-10 w-10 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-glow-sm group-hover:scale-105 transition-transform">
                            <ChatBubbleLeftRightIcon className="h-6 w-6 text-black" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-xl font-bold font-display tracking-tight text-white flex items-center">
                                RealNex<span className="text-3xl text-primary -ml-0.5">T</span>
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium tracking-wide uppercase -mt-1 ml-0.5">By Syndicate</span>
                        </div>
                    </Link>
                    <Link href="/">
                        <Button variant="outline" className="text-xs px-4 py-2 border-white/10 hover:bg-white/5">
                            <ArrowLeftIcon className="h-4 w-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </nav>

            {/* Content Section */}
            <main className="relative pt-32 pb-20 px-6 z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">Privacy Policy</h1>
                        <p className="text-gray-500 font-medium">Last updated: December 17, 2025</p>
                    </div>

                    <div className="space-y-12 text-gray-300 leading-relaxed prose prose-invert prose-orange max-w-none">
                        <section className="bg-[#161B22]/50 border border-white/5 rounded-2xl p-8 hover:border-primary/20 transition-all duration-300">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm mr-4 border border-primary/20">1</span>
                                Information We Collect
                            </h2>
                            <p className="mb-4">We collect information that you provide directly to us, including:</p>
                            <ul className="grid md:grid-cols-2 gap-3 list-none p-0">
                                {[
                                    'Name and contact information (email, phone number)',
                                    'Account credentials',
                                    'Profile information',
                                    'Communications with us',
                                    'Lead information submitted through forms'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow-sm" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="bg-[#161B22]/50 border border-white/5 rounded-2xl p-8 hover:border-primary/20 transition-all duration-300">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm mr-4 border border-primary/20">2</span>
                                How We Use Your Information
                            </h2>
                            <p className="mb-4">We use the information we collect to:</p>
                            <ul className="space-y-3 list-none p-0">
                                {[
                                    'Provide, maintain, and improve our services',
                                    'Process and complete transactions',
                                    'Send you technical notices and support messages',
                                    'Respond to your comments and questions',
                                    'Communicate with you about products, services, and events',
                                    'Monitor and analyze trends and usage'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start space-x-3">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="bg-[#161B22]/50 border border-white/5 rounded-2xl p-8 hover:border-primary/20 transition-all duration-300">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm mr-4 border border-primary/20">3</span>
                                Information Sharing
                            </h2>
                            <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
                            <ul className="mt-4 space-y-2 list-none p-0">
                                {['With your consent', 'To comply with legal obligations', 'To protect our rights and property', 'With service providers who assist in our operations'].map((item, i) => (
                                    <li key={i} className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-lg inline-block mr-2 mb-2">
                                        <span className="text-primary text-xs font-bold">●</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
                            <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
                        </section>

                        <section className="relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 shadow-glow-sm">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <ChatBubbleLeftRightIcon className="h-24 w-24 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">5. Facebook Lead Ads Integration</h2>
                            <p className="relative z-10 text-gray-200">When you submit a lead form through Facebook or Instagram ads, we collect the information you provide. This data is processed according to both our privacy policy and Facebook's data policies.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">6. Cookies and Tracking</h2>
                            <p>We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
                        </section>

                        <section className="grid md:grid-cols-2 gap-8">
                            <div className="bg-[#161B22]/50 border border-white/5 rounded-2xl p-8">
                                <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">7. Your Rights</h2>
                                <p className="text-sm text-gray-400 mb-6 font-medium">You have the right to:</p>
                                <ul className="space-y-3 list-none p-0">
                                    {['Access your personal information', 'Correct inaccurate data', 'Request deletion of your data', 'Object to processing of your data', 'Request data portability'].map((item, i) => (
                                        <li key={i} className="flex items-center space-x-3">
                                            <div className="w-1 h-1 bg-primary rounded-full" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-[#161B22]/50 border border-white/5 rounded-2xl p-8 flex flex-col justify-center">
                                <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">8. Data Retention</h2>
                                <p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required by law.</p>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                            <section>
                                <h2 className="text-xl font-bold text-white mb-4">9. Children's Privacy</h2>
                                <p className="text-sm">Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13.</p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-white mb-4">10. Changes to This Policy</h2>
                                <p className="text-sm">We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date.</p>
                            </section>
                        </div>

                        <section className="mt-16 bg-[#161B22] border border-white/10 rounded-2xl p-8 md:p-12 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">11. Contact Us</h2>
                            <p className="mb-6 text-gray-400">If you have any questions about this privacy policy, please contact us at:</p>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-black text-primary tracking-widest">Email</p>
                                    <p className="text-xl font-bold text-white font-display">info@niveshsarthi.com</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-black text-primary tracking-widest">Address</p>
                                    <p className="text-gray-300 font-medium leading-relaxed">Nivesh Sarthi, India</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="mt-20 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                        <p>&copy; 2026 RealNext CRM. All rights reserved.</p>
                        <Link href="/" className="hover:text-primary transition-colors mt-4 md:mt-0 font-bold uppercase tracking-widest text-[10px]">Back to RealNext Home</Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
