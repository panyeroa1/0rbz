
import React, { useState } from 'react';
import { 
  Sparkles, ListTodo, Presentation, BarChart3, Users, Settings, 
  X, CheckCircle2, Plus, TrendingUp, BrainCircuit, MessageCircle,
  Clock, Hash, FileText, LayoutDashboard, Zap, Search, Globe,
  ShieldCheck, HelpCircle, Palette, Share2, Filter
} from 'lucide-react';
import { SidebarTab, Task, Poll, User } from '../types';
import Whiteboard from './Whiteboard';

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onClose: () => void;
  tasks: Task[];
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  sentiment: string;
  speakerQueue: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, onTabChange, onClose, tasks, onAddTask, onToggleTask, sentiment, speakerQueue 
}) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const renderContent = () => {
    switch(activeTab) {
      case 'search':
        return (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Find in session..." 
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Recent Archives</h4>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2 cursor-pointer hover:bg-white/10 transition-all">
                <p className="text-xs font-bold text-blue-400">Project Specs_v2.pdf</p>
                <p className="text-[10px] text-zinc-500">Mentioned by Dr. Sarah Smith at 14:05</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2 cursor-pointer hover:bg-white/10 transition-all">
                <p className="text-xs font-bold text-purple-400">Budget_Draft.xlsx</p>
                <p className="text-[10px] text-zinc-500">Synced from contextual drive</p>
              </div>
            </div>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <section className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Sentiment Engine</h3>
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500 font-bold uppercase">Room Vibe</span>
                  <span className="text-lg font-bold text-white capitalize">{sentiment || 'Engaged'}</span>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500 animate-pulse" />
              </div>
            </section>
            
            <section className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">AI Facilitator</h3>
              <div className="space-y-2">
                <div className="p-3 bg-blue-600/5 rounded-xl border border-blue-500/20 text-xs text-blue-300 leading-relaxed">
                  <span className="font-black uppercase text-[10px] block mb-1">Coaching Tip:</span>
                  "Liam hasn't spoken in 10 minutes. Consider asking for his thoughts on the budget."
                </div>
                <div className="p-3 bg-zinc-900/50 rounded-xl border border-white/5 text-xs text-zinc-400 leading-relaxed italic">
                  "Your current pace is perfect for clarity. Maintain this flow for the translation sync."
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Live Executive Summary</h3>
              <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl">
                <ul className="space-y-3 text-sm text-zinc-300">
                  <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div> Aligned on Q3 goals.</li>
                  <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div> Sarah confirmed translation latency is sub-100ms.</li>
                  <li className="flex gap-2 opacity-50"><div className="w-1.5 h-1.5 bg-zinc-600 rounded-full mt-1.5 shrink-0"></div> (Next) Reviewing UI Branding.</li>
                </ul>
              </div>
            </section>
          </div>
        );
      case 'tasks':
        return (
          <div className="space-y-6">
            <div className="flex gap-2">
              <input 
                value={newTaskText} onChange={e => setNewTaskText(e.target.value)}
                placeholder="Add action item..."
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => { if(e.key === 'Enter' && newTaskText) { onAddTask(newTaskText); setNewTaskText(''); } }}
              />
              <button onClick={() => { if(newTaskText) { onAddTask(newTaskText); setNewTaskText(''); } }} className="p-2 bg-blue-600 rounded-xl"><Plus size={20}/></button>
            </div>
            <div className="space-y-2">
              {tasks.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => onToggleTask(t.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${t.completed ? 'bg-zinc-900/30 border-white/5 opacity-50' : 'bg-white/5 border-white/10 hover:border-blue-500/50'}`}
                >
                  <CheckCircle2 className={`w-5 h-5 ${t.completed ? 'text-green-500' : 'text-zinc-600'}`} />
                  <div className="flex flex-col items-start text-left">
                    <span className={`text-sm ${t.completed ? 'line-through' : ''}`}>{t.text}</span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase">Auto-Assigned</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 'whiteboard':
        return <div className="h-full"><Whiteboard /></div>;
      case 'participants':
        return (
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Virtual Hand-Raise Queue</h3>
              <div className="space-y-2">
                {speakerQueue.map((name, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-6 h-6 bg-blue-600/20 text-blue-400 text-[10px] font-black rounded-full flex items-center justify-center border border-blue-500/20">{i+1}</div>
                    <span className="text-sm font-bold">{name}</span>
                    <div className="flex-1"></div>
                    <button className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest">Acknowledge</button>
                  </div>
                ))}
                {speakerQueue.length === 0 && <div className="text-center py-4 text-zinc-600 text-xs italic">All hands are currently down.</div>}
              </div>
            </section>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Meeting Branding</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-xs font-bold mb-3">Room Logo</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 border border-white/10 border-dashed"><Palette size={18}/></div>
                    <button className="text-[10px] font-black text-blue-500 uppercase">Upload Asset</button>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-xs font-bold mb-3">Primary Motif</p>
                  <div className="flex gap-2">
                    {['#3b82f6', '#10b981', '#a855f7', '#f43f5e', '#ffffff'].map(c => (
                      <button key={c} className="w-8 h-8 rounded-lg border border-white/10" style={{backgroundColor: c}}></button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Encryption & Privacy</h3>
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                 <ShieldCheck className="w-5 h-5 text-green-500" />
                 <div>
                   <p className="text-[10px] font-black text-green-500 uppercase">Universal Shield Active</p>
                   <p className="text-[8px] text-green-500/60 font-medium">Character-sync data is end-to-end encrypted.</p>
                 </div>
              </div>
            </section>
          </div>
        );
      default: return null;
    }
  };

  const tabs: {id: SidebarTab, icon: any, label: string}[] = [
    {id: 'search', icon: Search, label: 'Search'},
    {id: 'ai', icon: Sparkles, label: 'Intelligence'},
    {id: 'tasks', icon: ListTodo, label: 'Tasks'},
    {id: 'whiteboard', icon: Presentation, label: 'Board'},
    {id: 'participants', icon: Users, label: 'Queue'},
    {id: 'settings', icon: Settings, label: 'Custom'},
  ];

  return (
    <div className="w-[400px] h-full bg-zinc-950/80 backdrop-blur-3xl border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-500 ease-out z-50">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-black uppercase tracking-tight">Premium Center</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-zinc-500"><X size={20}/></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar scroll-smooth">
        {renderContent()}
      </div>

      <div className="p-3 grid grid-cols-6 gap-1 bg-black/40 border-t border-white/5">
        {tabs.map(tab => (
          <button 
            key={tab.id} onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <tab.icon size={16} />
            <span className="text-[7px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
