import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, User, Bell, Activity, 
  ShieldCheck, Layout, GitBranch, Users, 
  BarChart3, Folder, Globe 
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  // Smooth scroll function
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D14] text-white font-sans selection:bg-indigo-500/30">
      
      {/* ================= NAVBAR ================= */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60 bg-[#0B0D14]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-6 h-6 bg-indigo-500 rounded-md"></div>
            ProjectSphere
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-400 font-medium">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-white hover:text-white transition">Overview</button>
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition">Features</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition">Pricing</button>
            <button onClick={() => scrollToSection('about')} className="hover:text-white transition">About</button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <div className="hidden md:flex items-center bg-[#131620] px-3 py-1.5 rounded-md border border-gray-800">
            <Search size={16} className="mr-2" />
            <input type="text" placeholder="Search..." className="bg-transparent text-sm focus:outline-none text-white w-32" />
          </div>
          <Bell size={18} className="hover:text-white cursor-pointer" />
          
          <div className="flex items-center gap-3 border-l border-gray-800 pl-4 ml-2">
         
            <User 
              size={18} 
              className="hover:text-white cursor-pointer" 
              onClick={() => navigate('/login')} 
            />
          </div>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="flex flex-col items-center text-center px-4 pt-24 pb-16">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-8">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          V 2.0 IS LIVE NOW
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
          Operating System for Modern Teams
        </h1>
        
        <p className="text-gray-400 text-lg max-w-2xl mb-10 leading-relaxed">
          A centralized workspace to track, collaborate, plan and engineering workflows, version control and release management across the software lifecycle.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => navigate('/register')}
            className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition shadow-[0_0_20px_rgba(99,102,241,0.3)]"
          >
            Start building for free
          </button>
          <button className="px-6 py-3 rounded-lg bg-[#131620] border border-gray-700 hover:bg-[#1a1e2d] text-white font-medium transition flex items-center justify-center gap-2">
            Book a Demo
          </button>
        </div>
      </section>

      {/* ================= SHOWCASE (BENTO GRID) ================= */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-[#131620] border border-gray-800/80 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold mb-1">Cloud Workspace</h3>
                <p className="text-sm text-gray-400">Fully integrated developer environment.</p>
              </div>
              <div className="p-2 bg-[#1C2030] rounded-lg text-indigo-400">
                <Layout size={20} />
              </div>
            </div>
            <div className="mt-8 bg-[#0B0D14] border border-gray-800 rounded-xl p-4 h-64 flex flex-col gap-4">
              <div className="w-1/3 h-4 bg-gray-800 rounded"></div>
              <div className="flex gap-4 h-full items-end">
                <div className="w-1/6 bg-indigo-500/20 border border-indigo-500/40 rounded-t-md h-[40%]"></div>
                <div className="w-1/6 bg-indigo-500/40 border border-indigo-500/60 rounded-t-md h-[70%]"></div>
                <div className="w-1/6 bg-indigo-500 rounded-t-md h-[90%]"></div>
                <div className="w-1/6 bg-indigo-500/40 border border-indigo-500/60 rounded-t-md h-[50%]"></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-[#131620] border border-gray-800/80 rounded-2xl p-6 flex-1 hover:border-gray-700 transition">
              <div className="p-2 bg-[#1C2030] inline-block rounded-lg text-indigo-400 mb-4">
                <Activity size={20} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Robust Sync</h3>
              <p className="text-sm text-gray-400">Changes reflect across team devices in real-time with our proprietary sync engine.</p>
            </div>
            
            <div className="bg-[#131620] border border-gray-800/80 rounded-2xl p-6 flex-1 hover:border-gray-700 transition">
              <div className="p-2 bg-[#1C2030] inline-block rounded-lg text-orange-400 mb-4">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Zero Trust Architecture</h3>
              <p className="text-sm text-gray-400">Enterprise-grade security standards with end-to-end encryption for your most sensitive data.</p>
            </div>
          </div>
          
        </div>
      </section>

      {/* ================= FEATURES GRID ================= */}
      <section id="features" className="px-6 md:px-12 max-w-7xl mx-auto py-20 text-center scroll-mt-20">
        <h2 className="text-3xl font-bold mb-4">Engineered for Reliability</h2>
        <p className="text-gray-400 mb-12">Everything you need to build software faster and scale globally.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {[
            { icon: <Layout />, title: "API First Design", desc: "Interact with our platform programmatically using fully documented REST and GraphQL endpoints." },
            { icon: <GitBranch />, title: "Visual Workflows", desc: "Design complex CI/CD pipelines visually. Drag, drop, and connect steps without writing code." },
            { icon: <Users />, title: "Team Topology", desc: "Manage permissions, roles, and access control dynamically across global offices and remote teams." },
            { icon: <BarChart3 />, title: "Advanced Metrics", desc: "Deep level analytics, performance tracking, and bottleneck identification powered by AI." },
            { icon: <Folder />, title: "Asset Library", desc: "A centralized, version-controlled repository for design tokens, media files, and branding." },
            { icon: <Globe />, title: "Community Mods", desc: "Access a library of over 20k custom plugins and extensions to connect your toolchain." },
          ].map((feature, i) => (
            <div key={i} className="bg-[#131620] border border-gray-800/80 rounded-xl p-6 hover:bg-[#181b27] transition">
              <div className="text-indigo-400 mb-4 p-2 bg-[#1C2030] inline-block rounded-lg">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section id="pricing" className="px-6 md:px-12 max-w-7xl mx-auto py-20 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Scalable Plans</h2>
          <p className="text-gray-400">Choose the perfect plan for your team's needs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Starter */}
          <div className="bg-[#131620] border border-gray-800 rounded-2xl p-8">
            <h3 className="text-xl font-medium text-gray-300 mb-2">Starter</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-500 text-sm">/ month</span>
            </div>
            <ul className="space-y-4 mb-8 text-sm text-gray-400">
              <li className="flex items-center gap-2">✓ Up to 3 members</li>
              <li className="flex items-center gap-2">✓ 10 Projects</li>
              <li className="flex items-center gap-2">✓ Basic Analytics</li>
            </ul>
            <button 
              onClick={() => navigate('/register')}
              className="w-full py-2.5 rounded-lg border border-gray-700 text-white hover:bg-gray-800 transition"
            >
              Get Started
            </button>
          </div>

          {/* Pro (Highlighted) */}
          <div className="bg-[#181b27] border-2 border-indigo-500 rounded-2xl p-8 relative transform scale-105 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full">
              Most Popular
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Pro</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold">$29</span>
              <span className="text-gray-400 text-sm">/ user / mo</span>
            </div>
            <ul className="space-y-4 mb-8 text-sm text-gray-300">
              <li className="flex items-center gap-2">✓ Unlimited Projects</li>
              <li className="flex items-center gap-2">✓ Advanced Dashboards</li>
              <li className="flex items-center gap-2">✓ Custom Workflows</li>
              <li className="flex items-center gap-2">✓ Priority Support</li>
            </ul>
            <button 
              onClick={() => navigate('/register')}
              className="w-full py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition"
            >
              Upgrade to Pro
            </button>
          </div>

          {/* Enterprise */}
          <div className="bg-[#131620] border border-gray-800 rounded-2xl p-8">
            <h3 className="text-xl font-medium text-gray-300 mb-2">Enterprise</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold">Custom</span>
            </div>
            <ul className="space-y-4 mb-8 text-sm text-gray-400">
              <li className="flex items-center gap-2">✓ SSO & SAML Access</li>
              <li className="flex items-center gap-2">✓ Volume Discounts</li>
              <li className="flex items-center gap-2">✓ 99.9% Uptime SLA</li>
              <li className="flex items-center gap-2">✓ Dedicated Manager</li>
            </ul>
            <button className="w-full py-2.5 rounded-lg border border-gray-700 text-white hover:bg-gray-800 transition">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* ================= BOTTOM CTA ================= */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto py-20">
        <div className="bg-gradient-to-b from-[#1c2030] to-[#0B0D14] border border-gray-800/80 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full"></div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">Ready to upgrade your team's workflow?</h2>
          <p className="text-gray-400 mb-8 relative z-10">Join 10,000+ modern teams already building the future with ProjectSphere.</p>
          <button 
            onClick={() => navigate('/register')}
            className="px-8 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition relative z-10 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
          >
            Start building for free
          </button>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer id="about" className="border-t border-gray-800/80 pt-16 pb-8 px-6 md:px-12 max-w-7xl mx-auto mt-12 scroll-mt-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1">
            <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-indigo-500 rounded-sm"></div>
              ProjectSphere
            </div>
            <p className="text-sm text-gray-500 max-w-xs">
              The definitive operating system for modern engineering and product teams.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-gray-200">Product</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><button onClick={() => scrollToSection('features')} className="hover:text-indigo-400 transition">Features</button></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Security</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Integrations</a></li>
              <li><button onClick={() => scrollToSection('pricing')} className="hover:text-indigo-400 transition">Pricing</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-gray-200">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-indigo-400 transition">Documentation</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Help Center</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Community</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Blog</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-gray-200">Company</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><button onClick={() => scrollToSection('about')} className="hover:text-indigo-400 transition">About Us</button></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Careers</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-800/50 text-sm text-gray-600">
          <p>© 2026 ProjectSphere Inc. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center hover:text-indigo-400 cursor-pointer">X</div>
            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center hover:text-indigo-400 cursor-pointer">in</div>
            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center hover:text-indigo-400 cursor-pointer">GH</div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;