import React, { useState, useEffect, useRef } from 'react';
import { 
  Wand2, Layout, Palette, Type, Settings, 
  Monitor, Tablet, Smartphone, RefreshCw, 
  ExternalLink, Code, FileText, Image as ImageIcon, 
  History as HistoryIcon, Download, Copy, Share2,
  ChevronLeft, ChevronRight, Plus, Trash2, Save,
  Check, AlertCircle, LogIn, UserPlus, LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WebsiteSettings, Project, GeneratedVersion, WebsiteType, DesignStyle } from './types';
import { generateWebsite } from './services/geminiService';
import JSZip from 'jszip';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <Icon size={18} />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const InputGroup = ({ label, children }: any) => (
  <div className="space-y-1.5 mb-4">
    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'dashboard' | 'builder'>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<{name: string, email: string} | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [domain, setDomain] = useState('');
  const [activeTab, setActiveTab] = useState<'code' | 'content' | 'assets' | 'history'>('code');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [prompt, setPrompt] = useState('Create a modern AI startup landing page with hero, features, testimonials, pricing and contact.');
  
  const [settings, setSettings] = useState<WebsiteSettings>({
    type: 'Landing Page',
    style: 'Modern',
    brandName: 'NovaAI',
    primaryColor: '#6366f1',
    secondaryColor: '#10b981',
    fontFamily: 'Inter',
    options: {
      responsive: true,
      animations: true,
      seo: true,
      accessibility: true,
      multipleSections: true
    }
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load projects from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nova_projects');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProjects(parsed);
    }
  }, []);

  // Save projects to localStorage
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('nova_projects', JSON.stringify(projects));
    }
  }, [projects]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const html = await generateWebsite(prompt, settings);
      
      const newVersion: GeneratedVersion = {
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        html,
        prompt,
        settings: { ...settings }
      };

      if (currentProject) {
        const updatedProject = {
          ...currentProject,
          versions: [newVersion, ...currentProject.versions].slice(0, 10),
          currentVersionId: newVersion.id,
          lastModified: Date.now()
        };
        setCurrentProject(updatedProject);
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      } else {
        const newProject: Project = {
          id: Math.random().toString(36).substring(7),
          name: settings.brandName || "Untitled Project",
          description: prompt.substring(0, 50) + "...",
          lastModified: Date.now(),
          versions: [newVersion],
          currentVersionId: newVersion.id
        };
        setProjects(prev => [newProject, ...prev]);
        setCurrentProject(newProject);
      }
      
      setView('builder');
    } catch (error) {
      alert("Generation failed. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentVersion = currentProject?.versions.find(v => v.id === currentProject.currentVersionId);

  const updatePreview = (html: string) => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  };

  useEffect(() => {
    if (currentVersion) {
      updatePreview(currentVersion.html);
    }
  }, [currentVersion, viewport]);

  const handleExport = async () => {
    if (!currentVersion) return;
    
    const zip = new JSZip();
    zip.file("index.html", currentVersion.html);
    
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${settings.brandName.toLowerCase()}-website.zip`;
    a.click();
  };

  const handlePublish = async () => {
    if (!currentVersion) return;
    
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: currentVersion.html, name: settings.brandName })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Published! URL: ${data.url}`);
      }
    } catch (error) {
      alert("Publishing failed.");
    }
  };

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Wand2 size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">NovaBuilder <span className="text-indigo-500">AI</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Documentation</button>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-zinc-400">Hi, {user.name}</span>
                <button onClick={() => setUser(null)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-all">Sign Out</button>
              </div>
            ) : (
              <>
                <button onClick={() => setShowAuth(true)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-all">Sign In</button>
                <button onClick={() => setShowAuth(true)} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-all">Get Started</button>
              </>
            )}
            <button 
              onClick={() => {
                setCurrentProject(null);
                setView('builder');
              }}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
            >
              Create New Website
            </button>
          </div>
        </header>

        {showAuth && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass p-8 rounded-3xl w-full max-w-md"
            >
              <h2 className="text-2xl font-bold mb-6 text-center">Join NovaBuilder AI</h2>
              <div className="space-y-4">
                <InputGroup label="Email Address">
                  <input type="email" placeholder="name@example.com" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none" />
                </InputGroup>
                <InputGroup label="Password">
                  <input type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none" />
                </InputGroup>
                <button 
                  onClick={() => {
                    setUser({ name: 'Designer', email: 'designer@example.com' });
                    setShowAuth(false);
                  }}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all mt-4"
                >
                  Sign In
                </button>
                <button onClick={() => setShowAuth(false)} className="w-full py-3 text-zinc-500 hover:text-white text-sm transition-colors">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}

        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">Welcome back, Designer</h1>
            <p className="text-zinc-400">Manage your AI-generated websites and start new projects.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create Card */}
            <button 
              onClick={() => {
                setCurrentProject(null);
                setView('builder');
              }}
              className="group h-64 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Plus size={24} />
              </div>
              <div className="text-center">
                <p className="font-semibold">New Project</p>
                <p className="text-xs text-zinc-500">Generate a site from scratch</p>
              </div>
            </button>

            {/* Project Cards */}
            {projects.map(project => (
              <div key={project.id} className="group glass rounded-2xl overflow-hidden flex flex-col hover:border-white/20 transition-all">
                <div className="h-40 bg-zinc-900 relative flex items-center justify-center overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                   <div className="text-xs font-mono text-zinc-600 opacity-20 select-none">PREVIEW_NOT_AVAILABLE</div>
                   <div className="absolute bottom-4 left-4 z-20">
                     <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">{project.versions[0]?.settings.type}</span>
                   </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg mb-1">{project.name}</h3>
                  <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-1">{project.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                      Modified {new Date(project.lastModified).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => {
                        setCurrentProject(project);
                        setSettings(project.versions[0].settings);
                        setPrompt(project.versions[0].prompt);
                        setView('builder');
                      }}
                      className="text-indigo-400 hover:text-indigo-300 text-sm font-bold flex items-center gap-1"
                    >
                      Edit <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Builder Header */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('dashboard')}
            className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="h-6 w-[1px] bg-white/10 mx-2" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight">{settings.brandName}</span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">Draft</span>
          </div>
        </div>

        {/* Viewport Controls */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
          <button 
            onClick={() => setViewport('desktop')}
            className={`p-2 rounded-lg transition-all ${viewport === 'desktop' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <Monitor size={16} />
          </button>
          <button 
            onClick={() => setViewport('tablet')}
            className={`p-2 rounded-lg transition-all ${viewport === 'tablet' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <Tablet size={16} />
          </button>
          <button 
            onClick={() => setViewport('mobile')}
            className={`p-2 rounded-lg transition-all ${viewport === 'mobile' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <Smartphone size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 text-sm font-medium transition-all"
          >
            <Download size={16} />
            Export
          </button>
          <button 
            onClick={handlePublish}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            <Share2 size={16} />
            Publish
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Prompt & Controls */}
        <aside className="w-80 border-r border-white/10 flex flex-col bg-zinc-950 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-6">
            <InputGroup label="Describe your website">
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g. A high-end restaurant landing page..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
            </InputGroup>

            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Type">
                <select 
                  value={settings.type}
                  onChange={(e) => setSettings({...settings, type: e.target.value as WebsiteType})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:outline-none"
                >
                  <option value="Landing Page">Landing Page</option>
                  <option value="Portfolio">Portfolio</option>
                  <option value="Business">Business</option>
                  <option value="Blog">Blog</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Agency">Agency</option>
                  <option value="Startup">Startup</option>
                  <option value="Ecommerce">Ecommerce</option>
                </select>
              </InputGroup>
              <InputGroup label="Style">
                <select 
                  value={settings.style}
                  onChange={(e) => setSettings({...settings, style: e.target.value as DesignStyle})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:outline-none"
                >
                  <option value="Modern">Modern</option>
                  <option value="Minimal">Minimal</option>
                  <option value="Dark">Dark</option>
                  <option value="Glass">Glass</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Neon">Neon</option>
                  <option value="Startup">Startup</option>
                </select>
              </InputGroup>
            </div>

            <InputGroup label="Brand Name">
              <input 
                type="text" 
                value={settings.brandName}
                onChange={(e) => setSettings({...settings, brandName: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:outline-none"
              />
            </InputGroup>

            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Primary">
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                  />
                  <span className="text-[10px] font-mono opacity-50 uppercase">{settings.primaryColor}</span>
                </div>
              </InputGroup>
              <InputGroup label="Secondary">
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                  />
                  <span className="text-[10px] font-mono opacity-50 uppercase">{settings.secondaryColor}</span>
                </div>
              </InputGroup>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={settings.options.responsive}
                  onChange={(e) => setSettings({...settings, options: {...settings.options, responsive: e.target.checked}})}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-indigo-500/50"
                />
                <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">Responsive Design</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={settings.options.animations}
                  onChange={(e) => setSettings({...settings, options: {...settings.options, animations: e.target.checked}})}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-indigo-500/50"
                />
                <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">Smooth Animations</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={settings.options.seo}
                  onChange={(e) => setSettings({...settings, options: {...settings.options, seo: e.target.checked}})}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-indigo-500/50"
                />
                <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">SEO Meta Tags</span>
              </label>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  Generate Website
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Center Panel: Live Preview */}
        <main className="flex-1 bg-zinc-900 flex flex-col items-center justify-center p-8 relative overflow-hidden">
          {/* Viewport Container */}
          <div 
            className={`bg-white rounded-lg shadow-2xl transition-all duration-500 overflow-hidden relative ${
              viewport === 'desktop' ? 'w-full h-full' : 
              viewport === 'tablet' ? 'w-[768px] h-[1024px] max-h-full' : 
              'w-[375px] h-[667px] max-h-full'
            }`}
          >
            {!currentVersion && !isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 bg-zinc-950">
                <Layout size={48} className="mb-4 opacity-20" />
                <p className="text-sm">Describe your site and click generate to see a preview.</p>
              </div>
            )}
            
            {isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm z-10">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" />
                <h2 className="text-xl font-bold mb-2">Crafting your website...</h2>
                <p className="text-zinc-400 animate-pulse">Designing layouts, writing copy, and styling components.</p>
              </div>
            )}

            <iframe 
              ref={iframeRef}
              className="w-full h-full border-none bg-white"
              title="Preview"
            />
          </div>

          {/* Floating Toolbar */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-2xl flex items-center gap-4 shadow-2xl">
            <button className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-all" title="Refresh Preview">
              <RefreshCw size={18} />
            </button>
            <div className="h-4 w-[1px] bg-white/10" />
            <button className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-all" title="Open in New Tab">
              <ExternalLink size={18} />
            </button>
          </div>
        </main>

        {/* Right Panel: Editor */}
        <aside className="w-96 border-l border-white/10 flex flex-col bg-zinc-950">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button 
              onClick={() => setActiveTab('code')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'code' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              Code
            </button>
            <button 
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'content' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              Content
            </button>
            <button 
              onClick={() => setActiveTab('assets')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'assets' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              Assets
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'history' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              History
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'code' && (
                <motion.div 
                  key="code"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Source Code</span>
                    <button 
                      onClick={() => {
                        if (currentVersion) {
                          navigator.clipboard.writeText(currentVersion.html);
                          alert("Code copied to clipboard!");
                        }
                      }}
                      className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-all"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  <textarea 
                    value={currentVersion?.html || ''}
                    readOnly
                    className="flex-1 w-full bg-zinc-900 border border-white/5 rounded-xl p-4 font-mono text-[10px] text-zinc-400 focus:outline-none resize-none"
                  />
                </motion.div>
              )}

              {activeTab === 'content' && (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex gap-3">
                    <AlertCircle size={18} className="text-indigo-400 shrink-0" />
                    <p className="text-xs text-indigo-200/80 leading-relaxed">
                      Content editing is currently in read-only mode. Use the prompt to regenerate specific sections.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <InputGroup label="Headline">
                      <input type="text" value={settings.brandName} readOnly className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm opacity-50" />
                    </InputGroup>
                    <InputGroup label="Description">
                      <textarea value={prompt} readOnly className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-2 text-sm opacity-50 resize-none" />
                    </InputGroup>
                  </div>
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div 
                  key="history"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  {currentProject?.versions.map((v, i) => (
                    <button 
                      key={v.id}
                      onClick={() => {
                        const updated = { ...currentProject, currentVersionId: v.id };
                        setCurrentProject(updated);
                        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
                      }}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${v.id === currentProject.currentVersionId ? 'bg-indigo-600/10 border-indigo-500' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">Version {currentProject.versions.length - i}</span>
                        <span className="text-[10px] text-zinc-500">{new Date(v.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-1">{v.prompt}</p>
                    </button>
                  ))}
                </motion.div>
              )}

              {activeTab === 'assets' && (
                <motion.div 
                  key="assets"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Custom Domain</h4>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="mysite.com" 
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 text-xs focus:outline-none" 
                      />
                      <button className="px-3 py-2 bg-indigo-600 rounded-lg text-xs font-bold">Connect</button>
                    </div>
                  </div>

                  <div className="h-48 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer">
                    <Plus size={24} className="text-zinc-500" />
                    <span className="text-xs font-medium text-zinc-400">Upload Assets</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="aspect-square rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group relative overflow-hidden">
                        <ImageIcon size={20} className="text-zinc-700" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-white/10 bg-zinc-950">
            <button 
              onClick={() => setView('dashboard')}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Save size={16} />
              Save Project
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
