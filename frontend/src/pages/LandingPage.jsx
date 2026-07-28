import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useSpring, 
  useMotionValue, 
  useMotionTemplate 
} from 'framer-motion';
import { 
  Search, User, Bell, Activity, 
  ShieldCheck, Layout, GitBranch, Users, 
  BarChart3, Folder, Globe, ArrowRight
} from 'lucide-react';

// ================= MOTION VARIANTS =================
const customEase = [0.16, 1, 0.3, 1];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const fadeUpVariant = {
  hidden: { opacity: 0, y: 40, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1, ease: customEase } }
};

const fadeScaleVariant = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.8, ease: customEase } }
};

// ================= CUSTOM COMPONENTS FOR ADVANCED EFFECTS =================

// 1. Fluttering Background Particles
const FlutteringParticles = () => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, 
      y: Math.random() * 100, 
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 2,
      scale: Math.random() * 2 + 0.5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 bg-indigo-400/40 rounded-full blur-[1px]"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          animate={{
            y: [0, -100, -200],
            x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20],
            opacity: [0, 0.8, 0],
            scale: [0, p.scale, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// 2. Fluttering Text Character Reveal
const FlutterText = ({ text, delay = 0, className }) => {
  return (
    <span className={`inline-flex flex-wrap justify-center ${className}`}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, rotateX: -90, y: 40, filter: "blur(10px)" }}
          animate={{ opacity: 1, rotateX: 0, y: 0, filter: "blur(0px)" }}
          transition={{ 
            duration: 0.8, 
            delay: delay + (i * 0.04), 
            ease: customEase,
            type: "spring",
            damping: 12
          }}
          className="inline-block pb-6 -mb-6 origin-bottom"
          style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
};

// 3. 3D Tilt Card Component
const TiltCard = ({ children, className }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateY, rotateX, transformStyle: "preserve-3d" }}
      className={`relative w-full rounded-2xl ${className}`}
    >
      <div style={{ transform: "translateZ(30px)" }} className="absolute inset-0 z-20 pointer-events-none" />
      {children}
    </motion.div>
  );
};

// 4. Mouse Spotlight Wrapper
const SpotlightWrapper = ({ children, className = "" }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div className={`relative group ${className}`} onMouseMove={handleMouseMove}>
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition duration-300 group-hover:opacity-100 z-30"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(99,102,241,0.15),
              transparent 80%
            )
          `,
        }}
      />
      {children}
    </div>
  );
};

// ================= MAIN LANDING PAGE =================

const LandingPage = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  
  // Progress bar spring for smoothness
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#07080f] text-white font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      
      {/* --- SCROLL PROGRESS INDICATOR --- */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 origin-left z-[100] shadow-[0_0_10px_rgba(99,102,241,0.5)]"
        style={{ scaleX }}
      />

      {/* --- ADVANCED BACKGROUND --- */}
      <FlutteringParticles />
      <div className="absolute inset-0 z-0 opacity-[0.015] pointer-events-none bg-[length:50px_50px] [background-image:linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]"></div>
      
      <motion.div 
        animate={{ scale: [1, 1.2, 1], x: [0, 100, 0], y: [0, -50, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 blur-[150px] rounded-full pointer-events-none z-0"
      />
      <motion.div style={{ y: y1 }} className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <motion.div style={{ y: y2 }} className="absolute bottom-[-20%] left-[20%] w-[800px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* ================= NAVBAR ================= */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: customEase }}
        className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#07080f]/60 backdrop-blur-xl sticky top-0 z-50"
      >
        <div className="flex items-center gap-8">
          <div className="text-xl font-bold tracking-tight text-white flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_20px_rgba(99,102,241,0.4)] overflow-hidden">
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2"
              />
            </div>
            ProjectSphere
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400 font-medium">
            {['Overview', 'Features', 'Pricing', 'About'].map((item) => (
              <button 
                key={item}
                onClick={() => item === 'Overview' ? window.scrollTo({ top: 0, behavior: 'smooth' }) : scrollToSection(item.toLowerCase())} 
                className="hover:text-white transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full"></span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <div className="flex items-center gap-3 border-l border-white/10 pl-5">
            <button onClick={() => navigate('/login')} className="hover:text-white transition-colors font-medium text-sm flex items-center gap-2 group">
              Sign In <motion.span className="group-hover:translate-x-1 transition-transform"><ArrowRight size={16} /></motion.span>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ================= HERO SECTION ================= */}
      <motion.section style={{ opacity: opacityHero }} className="relative z-10 flex flex-col items-center text-center px-4 pt-32 pb-24 min-h-[90vh] justify-center">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: customEase }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-10 backdrop-blur-md shadow-2xl"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          V 2.0 Engine is Live
        </motion.div>
        
        <div className="mb-2">
          <FlutterText 
            text="Engineering" 
            delay={0.1} 
            className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 leading-none"
          />
        </div>
        <div className="mb-8">
          <FlutterText 
            text="Perfected." 
            delay={0.6} 
            className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 leading-none"
          />
        </div>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2, ease: customEase }}
          className="text-gray-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed font-light mt-4"
        >
          A centralized, ultra-fast workspace to track workflows, sync code, and manage product lifecycles with absolute precision.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.4, ease: customEase }}
          className="flex flex-col sm:flex-row gap-5"
        >
          <SpotlightWrapper className="rounded-xl">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')} 
              className="relative px-8 py-4 rounded-xl bg-white text-black font-semibold text-lg hover:bg-gray-100 transition-colors z-10 w-full sm:w-auto shadow-[0_0_40px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 group"
            >
              Start building 
              <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}><ArrowRight size={18} /></motion.span>
            </motion.button>
          </SpotlightWrapper>
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-xl bg-transparent border border-white/10 hover:border-white/30 text-white font-medium text-lg transition-all backdrop-blur-md"
          >
            View Documentation
          </motion.button>
        </motion.div>
      </motion.section>

      {/* ================= 3D SHOWCASE (BENTO GRID) ================= */}
      <motion.section 
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="px-6 md:px-12 max-w-7xl mx-auto py-20 relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <TiltCard className="lg:col-span-2">
            <motion.div variants={fadeScaleVariant} className="bg-[#0f111a]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-10 h-full relative overflow-hidden group shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="flex justify-between items-start mb-8 relative z-20">
                <div>
                  <h3 className="text-3xl font-bold mb-2 text-white tracking-tight">Cloud Workspace</h3>
                  <p className="text-gray-400 font-light text-lg">Your entire developer environment, instantly synced.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl text-indigo-400 border border-white/10 shadow-inner backdrop-blur-md">
                  <Layout size={28} />
                </div>
              </div>
              
              <div className="mt-4 bg-[#07080f] border border-white/5 rounded-2xl p-6 h-72 flex flex-col gap-5 relative z-20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] overflow-hidden">
                <div className="w-1/2 h-5 bg-white/10 rounded-md"></div>
                <div className="flex gap-4 h-full items-end mt-4">
                  {[40, 70, 100, 60, 85, 35].map((height, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${height}%` }}
                      transition={{ duration: 1.5, delay: 0.1 * i, type: "spring", bounce: 0.4 }}
                      viewport={{ once: true }}
                      className={`flex-1 rounded-t-lg relative overflow-hidden ${i === 2 ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/5 border-t border-white/10'}`}
                    >
                      {i === 2 && <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </TiltCard>

          <div className="flex flex-col gap-8">
            <TiltCard>
              <motion.div variants={fadeScaleVariant} className="bg-[#0f111a]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-10 h-full relative overflow-hidden shadow-2xl group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full group-hover:bg-purple-500/30 transition-colors"></div>
                <div className="p-3 bg-white/5 inline-block rounded-xl text-purple-400 mb-6 border border-white/10 relative z-20">
                  <Activity size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white relative z-20">Quantum Sync</h3>
                <p className="text-gray-400 font-light leading-relaxed relative z-20">State updates propagate across the globe in less than 40ms.</p>
              </motion.div>
            </TiltCard>
            
            <TiltCard>
              <motion.div variants={fadeScaleVariant} className="bg-[#0f111a]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-10 h-full relative overflow-hidden shadow-2xl group">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/20 blur-3xl rounded-full group-hover:bg-emerald-500/30 transition-colors"></div>
                <div className="p-3 bg-white/5 inline-block rounded-xl text-emerald-400 mb-6 border border-white/10 relative z-20">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white relative z-20">Zero Trust</h3>
                <p className="text-gray-400 font-light leading-relaxed relative z-20">Military-grade encryption securing your pipeline from edge to core.</p>
              </motion.div>
            </TiltCard>
          </div>
        </div>
      </motion.section>

      {/* ================= FEATURES GRID ================= */}
      <motion.section 
        id="features" 
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="px-6 md:px-12 max-w-7xl mx-auto py-32 text-center scroll-mt-20 relative z-10"
      >
        <motion.h2 variants={fadeUpVariant} className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Engineered for Scale</motion.h2>
        <motion.p variants={fadeUpVariant} className="text-gray-400 mb-20 text-xl font-light max-w-2xl mx-auto">Complex architecture abstracted into a beautiful, fluid interface.</motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {[
            { icon: <Layout />, title: "Headless Architecture", desc: "Build custom frontends using our fully documented REST and GraphQL endpoints." },
            { icon: <GitBranch />, title: "Visual CI/CD", desc: "Design complex deployment pipelines visually. Drag, drop, and deploy instantly." },
            { icon: <Users />, title: "Granular Topology", desc: "Dynamic RBAC permissions and access control across global engineering teams." },
            { icon: <BarChart3 />, title: "Predictive Analytics", desc: "AI-driven performance tracking that identifies bottlenecks before they happen." },
            { icon: <Folder />, title: "Unified Asset Hub", desc: "Version-controlled repository for system design tokens and architecture maps." },
            { icon: <Globe />, title: "Global Edge Network", desc: "Deployed on the edge. Access your workspace with single-digit latency worldwide." },
          ].map((feature, i) => (
            <SpotlightWrapper key={i} className="rounded-3xl">
              <motion.div 
                variants={fadeUpVariant}
                className="bg-[#0f111a] border border-white/5 rounded-[inherit] p-8 h-full relative z-20"
              >
                <div className="text-indigo-400 mb-6 p-3 bg-white/5 inline-block rounded-2xl border border-white/10 shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed font-light">{feature.desc}</p>
              </motion.div>
            </SpotlightWrapper>
          ))}
        </div>
      </motion.section>

      {/* ================= PRICING ================= */}
      <motion.section 
        id="pricing" 
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="px-6 md:px-12 max-w-7xl mx-auto py-24 scroll-mt-20 relative z-10"
      >
        <motion.div variants={fadeUpVariant} className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Transparent Pricing</h2>
          <p className="text-gray-400 text-xl font-light">Start for free, scale infinitely.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Starter */}
          <motion.div variants={fadeScaleVariant} className="bg-[#0f111a] border border-white/5 rounded-3xl p-10 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-300 mb-2">Hobby</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-5xl font-black text-white">$0</span>
              <span className="text-gray-500 font-medium">/ month</span>
            </div>
            <ul className="space-y-5 mb-10 text-gray-400 font-light">
              <li className="flex items-center gap-3">✓ Up to 3 members</li>
              <li className="flex items-center gap-3">✓ 10 Projects max</li>
              <li className="flex items-center gap-3">✓ Basic Analytics</li>
            </ul>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/register')} className="w-full py-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-semibold">
              Deploy Free
            </motion.button>
          </motion.div>

          {/* Pro (Highlighted) */}
          <motion.div variants={fadeScaleVariant} className="bg-[#141726] border border-indigo-500/40 rounded-3xl p-10 relative md:scale-110 shadow-[0_0_60px_rgba(99,102,241,0.15)] z-20">
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full"></div>
            </div>
            
            <div className="absolute top-0 right-10 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold uppercase tracking-widest py-2 px-5 rounded-full shadow-lg border border-white/20 z-30">
              Pro Engine
            </div>

            <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Professional</h3>
            <div className="flex items-baseline gap-1 mb-8 relative z-10">
              <span className="text-5xl font-black text-white">$29</span>
              <span className="text-indigo-300 font-medium">/ user / mo</span>
            </div>
            <ul className="space-y-5 mb-10 text-gray-200 font-light relative z-10">
              <li className="flex items-center gap-3">✓ Unlimited Projects</li>
              <li className="flex items-center gap-3">✓ Advanced Custom Dashboards</li>
              <li className="flex items-center gap-3">✓ Visual Workflow Builder</li>
              <li className="flex items-center gap-3">✓ 24/7 Priority Support</li>
            </ul>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/register')} className="w-full py-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition-colors shadow-lg relative z-10">
              Upgrade to Pro
            </motion.button>
          </motion.div>

          {/* Enterprise */}
          <motion.div variants={fadeScaleVariant} className="bg-[#0f111a] border border-white/5 rounded-3xl p-10 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-300 mb-2">Enterprise</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-5xl font-black text-white">Custom</span>
            </div>
            <ul className="space-y-5 mb-10 text-gray-400 font-light">
              <li className="flex items-center gap-3">✓ Single Sign-On (SSO)</li>
              <li className="flex items-center gap-3">✓ Volume Discounting</li>
              <li className="flex items-center gap-3">✓ 99.99% Uptime SLA</li>
              <li className="flex items-center gap-3">✓ Dedicated Architect</li>
            </ul>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full py-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-semibold">
              Contact Sales
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* ================= BOTTOM CTA ================= */}
      <motion.section 
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="px-6 md:px-12 max-w-6xl mx-auto py-32 relative z-10"
      >
        <SpotlightWrapper className="rounded-[3rem]">
          <motion.div variants={fadeScaleVariant} className="bg-gradient-to-b from-[#141726] to-[#0f111a] border border-white/10 rounded-[inherit] p-16 md:p-24 text-center relative overflow-hidden shadow-2xl z-20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none"></div>
            
            <h2 className="text-4xl md:text-6xl font-black mb-8 relative z-10 text-white tracking-tight leading-tight">Build the future. <br/> Faster than ever.</h2>
            <p className="text-gray-400 mb-12 relative z-10 text-xl font-light max-w-2xl mx-auto">Join the top 1% of engineering teams already executing flawlessly with ProjectSphere.</p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')} 
              className="px-12 py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all relative z-10 shadow-[0_0_50px_rgba(255,255,255,0.3)]"
            >
              Initialize Workspace
            </motion.button>
          </motion.div>
        </SpotlightWrapper>
      </motion.section>

      {/* ================= FOOTER ================= */}
      <motion.footer 
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={staggerContainer}
        id="about" 
        className="border-t border-white/5 pt-20 pb-10 px-6 md:px-12 max-w-7xl mx-auto mt-12 scroll-mt-20 relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <motion.div variants={fadeUpVariant} className="col-span-1">
            <div className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md"></div>
              ProjectSphere
            </div>
            <p className="text-sm text-gray-500 max-w-xs font-light leading-relaxed">
              The definitive operating system for modern engineering, design, and product teams.
            </p>
          </motion.div>
          
          <motion.div variants={fadeUpVariant}>
            <h4 className="font-semibold mb-6 text-gray-200 uppercase tracking-widest text-xs">Product</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-light">
              <li><button onClick={() => scrollToSection('features')} className="hover:text-indigo-400 transition-colors">Features</button></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Enterprise</a></li>
              <li><button onClick={() => scrollToSection('pricing')} className="hover:text-indigo-400 transition-colors">Pricing</button></li>
            </ul>
          </motion.div>
          
          <motion.div variants={fadeUpVariant}>
            <h4 className="font-semibold mb-6 text-gray-200 uppercase tracking-widest text-xs">Resources</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-light">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Community Discord</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Engineering Blog</a></li>
            </ul>
          </motion.div>
          
          <motion.div variants={fadeUpVariant}>
            <h4 className="font-semibold mb-6 text-gray-200 uppercase tracking-widest text-xs">Company</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-light">
              <li><button onClick={() => scrollToSection('about')} className="hover:text-indigo-400 transition-colors">About Us</button></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a></li>
            </ul>
          </motion.div>
        </div>
        
        <motion.div variants={fadeUpVariant} className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 text-sm text-gray-600 font-light">
          <p>© 2026 ProjectSphere Inc. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white cursor-pointer transition-colors border border-white/5">𝕏</div>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white cursor-pointer transition-colors border border-white/5">in</div>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white cursor-pointer transition-colors border border-white/5">GH</div>
          </div>
        </motion.div>
      </motion.footer>

    </div>
  );
};

export default LandingPage;