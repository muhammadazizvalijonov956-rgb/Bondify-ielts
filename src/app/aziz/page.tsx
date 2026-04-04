"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Github, 
  Send, 
  Mail, 
  ExternalLink, 
  Code2, 
  Database, 
  Globe, 
  Award, 
  Rocket, 
  ChevronRight,
  Monitor,
  Cpu,
  Layers,
  Zap,
  CheckCircle2,
  Linkedin,
} from 'lucide-react';

export default function AzizPortfolio() {
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState<string[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisibleSections(prev => prev.includes(entry.target.id) ? prev : [...prev, entry.target.id]);
        }
      });
    }, { threshold: 0.1 });

    const sections = ['hero', 'project', 'skills', 'experience', 'contact'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const handleScroll = (e: any) => {
      setScrolled(e.target.scrollTop > 50);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      observer.disconnect();
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const isVisible = (id: string) => visibleSections.includes(id);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[10000] bg-[#0a0a0a] text-zinc-100 overflow-y-auto selection:bg-[#86e329] selection:text-[#0a0a0a] font-sans scroll-smooth"
    >
      {/* Custom Navbar (Internal) */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-800/50 py-4' : 'bg-transparent py-8'}`}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-default">
            <div className="w-8 h-8 rounded-lg bg-[#86e329] flex items-center justify-center font-bold text-black rotate-12 group-hover:rotate-0 transition-transform">MV</div>
            <span className="font-bold text-lg tracking-tight uppercase">Muhammadaziz</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#project" className="hover:text-[#86e329] transition-colors">Project</a>
            <a href="#skills" className="hover:text-[#86e329] transition-colors">Skills</a>
            <a href="#experience" className="hover:text-[#86e329] transition-colors">Experience</a>
            <a href="#contact" className="hover:text-[#86e329] transition-colors">Contact</a>
          </div>
          <a href="mailto:muhammadaziz@bondify.uz" className="bg-zinc-900 border border-zinc-800 hover:border-[#86e329] px-5 py-2 rounded-full text-sm font-semibold transition-all hover:shadow-[0_0_15px_rgba(134,227,41,0.2)]">
            Hire Me
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex flex-col justify-center px-6 pt-24 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-[#86e329]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-[#1a1a1a] rounded-full blur-[120px] pointer-events-none opacity-50" />

        <div className="max-w-6xl mx-auto w-full grid md:grid-cols-[1fr_400px] gap-12 items-center relative z-10">
          <div className="space-y-8">
            <div className={`space-y-4 transition-all duration-1000 transform ${isVisible('hero') ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-100'}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#86e329]/10 border border-[#86e329]/20 text-[#86e329] text-xs font-bold uppercase tracking-widest mb-4">
                <Rocket className="w-3 h-3" /> Available for projects
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
                Muhammadaziz <br />
                <span className="text-zinc-600">Valijonov.</span>
              </h1>
              <h2 className="text-xl md:text-2xl font-medium text-zinc-400 max-w-xl leading-relaxed">
                Full-Stack Developer (EdTech Focus). <br />
                I build <span className="text-zinc-100 italic">scalable education systems</span> and real-world applications.
              </h2>
            </div>

            <div className={`flex flex-wrap gap-4 transition-all duration-1000 delay-300 transform ${isVisible('hero') ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-100'}`}>
              <a href="#project" className="bg-[#86e329] text-black px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-[#97f43a] transition-all hover:scale-[1.02]">
                View Projects <ChevronRight className="w-4 h-4" />
              </a>
              <a href="#contact" className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all">
                Contact Me
              </a>
            </div>
          </div>

          <div className={`relative transition-all duration-1000 delay-500 transform ${isVisible('hero') ? 'scale-100 opacity-100' : 'scale-95 opacity-100'}`}>
            <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden border border-zinc-800 shadow-2xl group">
              <img 
                src="/assets/images/aziz_portfolio.png" 
                alt="Muhammadaziz Valijonov" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-40" />
            </div>
            {/* Decoration */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center shadow-2xl transform rotate-6 hover:rotate-0 transition-transform cursor-default">
              <span className="text-[#86e329] text-3xl font-black">2+</span>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Years Exp.</span>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-20 hidden md:block">
          <div className="w-6 h-10 border-2 border-zinc-500 rounded-full flex justify-center p-1">
            <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="project" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className={`mb-16 transition-all duration-1000 transform ${isVisible('project') ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-sm font-black text-[#86e329] uppercase tracking-[0.3em] mb-4">Featured Work</h2>
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight">Real-world solutions.</h3>
          </div>

          <div className={`relative group transition-all duration-1000 delay-200 transform ${isVisible('project') ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="absolute -inset-1 bg-[#86e329]/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative grid md:grid-cols-2 bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl">
              <div className="p-8 md:p-12 flex flex-col justify-center gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img src="/assets/images/bondify_logo.png" alt="Bondify" className="w-10 h-10 object-contain rounded-lg bg-white p-1" />
                    <h4 className="text-3xl font-black tracking-tight">Bondify</h4>
                  </div>
                  <p className="text-zinc-400 text-lg leading-relaxed">
                    A comprehensive IELTS platform designed to simulate the real exam environment. Built to help students master their language skills with automated precision.
                  </p>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Core Features</h5>
                  <ul className="grid grid-cols-2 gap-3">
                    {[
                      'Exam Simulation', 
                      'Automated Scoring', 
                      'Admin Panel', 
                      'Progress Tracking',
                      'L/R/W/S Systems',
                      'Session Management'
                    ].map(feat => (
                      <li key={feat} className="flex items-center gap-2 text-sm text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-[#86e329]" /> {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 flex items-center gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-black">Tech Stack</span>
                    <div className="flex gap-3 text-zinc-300">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium">Next.js / Firebase / Supabase</span>
                    </div>
                  </div>
                  <a 
                    href="https://bondify.uz" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-2 text-zinc-100 hover:text-[#86e329] transition-colors font-bold group/link"
                  >
                    Live Project <ExternalLink className="w-4 h-4 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                  </a>
                </div>
              </div>
              <div className="bg-zinc-800/50 p-4 flex items-center justify-center border-l border-zinc-800 overflow-hidden">
                <div className="relative w-full h-[400px] rounded-xl overflow-hidden shadow-2xl transition-transform duration-700 group-hover:scale-105">
                  <img 
                    src="/assets/images/bondify_logo.png" 
                    alt="Bondify Preview" 
                    className="w-full h-full object-contain opacity-20 scale-150 rotate-12"
                  />
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                     <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-zinc-700/50 p-6 rounded-2xl w-full max-w-sm space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          </div>
                          <div className="text-[10px] font-bold text-zinc-600 uppercase">Interactive Exam Panel</div>
                        </div>
                        <div className="space-y-3">
                          <div className="h-4 bg-zinc-800 rounded w-3/4" />
                          <div className="h-4 bg-zinc-800 rounded w-1/2" />
                          <div className="h-32 bg-zinc-800/50 rounded flex items-center justify-center">
                            <Monitor className="w-12 h-12 text-zinc-700" />
                          </div>
                          <div className="flex justify-between">
                             <div className="h-8 bg-[#86e329]/20 border border-[#86e329]/40 rounded w-24" />
                             <div className="h-8 bg-zinc-800 rounded w-24" />
                          </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-32 px-6 bg-zinc-950/50 relative">
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-20 transition-all duration-1000 transform ${isVisible('skills') ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-sm font-black text-[#86e329] uppercase tracking-[0.3em] mb-4">Stack</h2>
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight">Capabilities.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Frontend",
                icon: <Globe className="w-6 h-6" />,
                skills: ["React", "Next.js", "Tailwind CSS", "TypeScript"]
              },
              {
                title: "Backend",
                icon: <Database className="w-6 h-6" />,
                skills: ["Firebase", "Supabase", "Node.js", "PostgreSQL", "API Design"]
              },
              {
                title: "Architecture",
                icon: <Layers className="w-6 h-6" />,
                skills: ["Full-stack logic", "System Design", "UI/UX", "Operations"]
              }
            ].map((category, idx) => (
              <div 
                key={category.title}
                className={`group p-8 bg-zinc-900 border border-zinc-800 rounded-3xl hover:border-zinc-700 transition-all transform duration-1000 delay-[200ms] ${isVisible('skills') ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-[#86e329] mb-6 group-hover:scale-110 group-hover:bg-[#86e329] group-hover:text-black transition-all">
                  {category.icon}
                </div>
                <h4 className="text-xl font-bold mb-4">{category.title}</h4>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-400 font-medium whitespace-nowrap">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className={`mb-16 transition-all duration-1000 transform ${isVisible('experience') ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-sm font-black text-[#86e329] uppercase tracking-[0.3em] mb-4">Journey</h2>
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight">Experience.</h3>
          </div>

          <div className={`space-y-12 transition-all duration-1000 delay-200 transform ${isVisible('experience') ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="relative pl-12 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-zinc-800">
              <div className="absolute left-[-6px] top-2 w-3 h-3 rounded-full bg-[#86e329] shadow-[0_0_10px_#86e329]" />
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                <div>
                  <h4 className="text-2xl font-bold text-zinc-100">Support Mentor & Operations Assistant</h4>
                  <p className="text-lg text-zinc-400 font-medium">Andijan Development Center</p>
                </div>
                <span className="inline-block px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-2 md:mt-0">
                  Current
                </span>
              </div>
              <ul className="space-y-3 text-zinc-400 max-w-2xl">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#86e329]/50 mt-2 shrink-0" />
                  <span>Mentoring students for IELTS success.</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#86e329]/50 mt-2 shrink-0" />
                  <span>Coordinating student-mentor sessions effectively.</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#86e329]/50 mt-2 shrink-0" />
                  <span>Supporting academic operations and system management.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 px-6 bg-gradient-to-b from-[#0a0a0a] to-[#0d0d0d]">
        <div className="max-w-6xl mx-auto">
          <div className={`p-12 md:p-20 bg-zinc-900 border border-zinc-800 rounded-[3rem] text-center space-y-8 relative overflow-hidden transition-all duration-1000 transform ${isVisible('contact') ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-full bg-[#86e329]/5 blur-[100px] pointer-events-none" />
            
            <h2 className="text-sm font-black text-[#86e329] uppercase tracking-[0.3em]">Let's Connect</h2>
            <h3 className="text-5xl md:text-7xl font-black tracking-tighter max-w-3xl mx-auto leading-tight">
              Ready to build the future of education?
            </h3>
            
            <div className="flex flex-wrap justify-center gap-6 pt-8">
              <a href="mailto:muhammadaziz@bondify.uz" className="group flex items-center gap-3 bg-[#86e329] text-black px-8 py-4 rounded-2xl font-bold transition-all hover:scale-105">
                <Mail className="w-5 h-5" />
                Email Me
              </a>
              <a href="https://github.com" className="group flex items-center gap-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 px-8 py-4 rounded-2xl font-bold transition-all hover:scale-105">
                <Github className="w-5 h-5" />
                GitHub
              </a>
              <a href="https://t.me" className="group flex items-center gap-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 px-8 py-4 rounded-2xl font-bold transition-all hover:scale-105">
                <Send className="w-5 h-5 text-blue-500" />
                Telegram
              </a>
            </div>

            <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] border-t border-zinc-800/50 mt-12">
               <div>2026 &copy; MUHAMMADAZIZ</div>
               <div>BUILT WITH NEXT.JS</div>
               <div>BASED IN UZBEKISTAN</div>
            </div>
          </div>
        </div>
      </section>

      {/* Back to top hint */}
      <div className="text-center py-10 opacity-20 pointer-events-none">
        <span className="text-[10px] uppercase font-black tracking-[0.5em]">Secret Portfolio Route /aziz</span>
      </div>
    </div>
  );
}
