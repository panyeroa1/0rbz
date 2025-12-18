
import React, { useState } from 'react';
import { 
  Plus, Video, Calendar, LogOut, ChevronRight, Globe, Loader2, Orbit, 
  History, Settings, Search, Bell, Moon, Sun, Palette, LayoutGrid,
  FileText, Star, ArrowUpRight, User as UserIcon, Check, Users
} from 'lucide-react';
import { User, MeetingConfig, RecentSession, Theme } from '../types.ts';
import { BRAND_NAME, LANGUAGES, MEETING_TEMPLATES } from '../constants.ts';

interface DashboardProps {
  user: User;
  onJoinMeeting: (config: MeetingConfig) => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onJoinMeeting, onLogout }) => {
  const [targetLang, setTargetLang] = useState(user.preferredLanguage || 'en-US');
  const [meetingId, setMeetingId] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'records' | 'schedule' | 'settings'>('home');
  const [theme, setTheme] = useState<Theme>('dark');

  const recentSessions: RecentSession[] = [
    { id: '1', title: 'Q3 Strategy Sync', date: '2 hours ago', participants: 4, summary: 'Discussed global expansion and AI translation latency.' },
    { id: '2', title: 'Design Review', date: 'Yesterday', participants: 3, summary: 'Finalized cosmic glassmorphism specs for the Dock component.' }
  ];

  const createMeeting = (templateId?: string) => {
    const id = Math.random().toString(36).substring(7).toUpperCase();
    onJoinMeeting({ 
      roomId: id, 
      isHost: true, 
      audioEnabled: true, 
      videoEnabled: true, 
      targetLanguage: targetLang,
      template: templateId 
    });
  };

  return (
    <div className={`flex-1 flex w-full h-full overflow-hidden ${theme === 'light' ? 'bg-zinc-50 text-black' : 'bg-[#050505] text-white'}`}>
      {/* Navigation Rail */}
      <div className="w-20 border-r border-white/5 flex flex-col items-center py-8 gap-10 bg-black/20 backdrop-blur-3xl shrink-0">
        <div className="p-3 bg-blue-600 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.5)]">
          <Orbit className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 flex flex-col gap-6">
          {[
            { id: 'home', icon: LayoutGrid },
            { id: 'records', icon: History },
            { id: 'schedule', icon: Calendar },
            { id: 'settings', icon: Settings }
          ].map(tab => (
            <button 
              key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`p-4 rounded-2xl transition-all relative group ${activeTab === tab.id ? 'bg-blue-600/20 text-blue-400' : 'text-zinc-500 hover:text-white'}`}
            >
              <tab.icon size={24} />
              {activeTab === tab.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full"></div>}
            </button>
          ))}
        </div>
        <button onClick={onLogout} className="p-4 text-zinc-500 hover:text-red-500 transition-colors"><LogOut size={24} /></button>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/10 backdrop-blur-md shrink-0">
          <h1 className="text-xl font-black tracking-tighter uppercase">{activeTab}</h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
              <button onClick={() => setTheme('light')} className={`p-2 rounded-lg ${theme === 'light' ? 'bg-white text-black' : 'text-zinc-500'}`}><Sun size={16}/></button>
              <button onClick={() => setTheme('dark')} className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}><Moon size={16}/></button>
            </div>
            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                 <p className="text-sm font-bold leading-none">{user.name}</p>
                 <p className="text-[10px] text-blue-500 uppercase font-black">Orbit Prime</p>
               </div>
               <div className="w-10 h-10 rounded-xl border border-blue-500/30 overflow-hidden shadow-lg shadow-blue-500/10">
                 <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`} alt="Avatar" />
               </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button onClick={() => createMeeting()} className="group aspect-[1.5/1] bg-blue-600 hover:bg-blue-500 rounded-[32px] p-8 transition-all flex flex-col justify-between overflow-hidden shadow-2xl shadow-blue-500/20">
                    <div className="p-4 bg-white/20 backdrop-blur-xl rounded-2xl w-fit"><Video className="w-8 h-8 text-white" /></div>
                    <div className="text-left">
                      <h3 className="text-3xl font-black uppercase mb-1 tracking-tighter">Start Meeting</h3>
                      <p className="text-blue-100/70 font-medium">Native-Audio AI Enabled</p>
                    </div>
                  </button>
                  <div className="aspect-[1.5/1] bg-zinc-900/40 border border-white/5 rounded-[32px] p-8 flex flex-col justify-between hover:bg-white/5 transition-all">
                    <Calendar className="w-8 h-8 text-blue-500" />
                    <div className="text-left">
                      <h3 className="text-2xl font-black uppercase tracking-tight">Schedule</h3>
                      <p className="text-zinc-500 text-sm">Plan future syncs</p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/20 border border-white/5 rounded-[32px] p-10 flex flex-col md:flex-row gap-8 items-center">
                   <div className="flex-1 space-y-4">
                     <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3"><Globe className="w-5 h-5 text-blue-500" /> Join via Orbit ID</h3>
                     <div className="flex gap-3">
                       <input 
                        value={meetingId} onChange={(e) => setMeetingId(e.target.value.toUpperCase())}
                        placeholder="ORBIT-XXXX-XXXX" className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-xl font-mono focus:ring-1 focus:ring-blue-500 outline-none" 
                       />
                       <button className="bg-white text-black px-8 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">Link</button>
                     </div>
                   </div>
                </div>
              </div>

              {/* Dialect / Language Selector Sidebar */}
              <div className="space-y-6">
                <div className="bg-zinc-900/40 border border-white/10 rounded-[32px] p-8 shadow-xl">
                   <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-500 mb-6 flex items-center gap-2">Dialect Engine</h3>
                   <div className="space-y-6">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Selected Region</label>
                       <div className="relative">
                         <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                         <select 
                          className="w-full bg-black/60 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white font-bold text-sm outline-none cursor-pointer appearance-none"
                          value={targetLang} onChange={e => setTargetLang(e.target.value)}
                         >
                           {LANGUAGES.map(group => (
                             <optgroup key={group.group} label={group.group} className="bg-zinc-900 text-zinc-500 uppercase text-[10px]">
                               {group.options.map(opt => (
                                 <option key={opt.code} value={opt.code} className="bg-black text-white">{opt.name}</option>
                               ))}
                             </optgroup>
                           ))}
                         </select>
                       </div>
                     </div>
                     <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                       <p className="text-[10px] text-blue-400 font-black uppercase mb-1">Character-Sync</p>
                       <p className="text-xs text-zinc-400 leading-relaxed">Orbit will optimize translation nuances for the <strong>{LANGUAGES.flatMap(g => g.options).find(o => o.code === targetLang)?.name}</strong> dialect.</p>
                     </div>
                   </div>
                </div>

                <div className="bg-zinc-900/40 border border-white/10 rounded-[32px] p-8">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Quick Templates</h3>
                  <div className="space-y-3">
                    {MEETING_TEMPLATES.map(t => (
                      <button key={t.id} onClick={() => createMeeting(t.id)} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-blue-600/10 transition-all group border border-transparent hover:border-blue-500/30">
                        <div className="text-left">
                          <p className="text-sm font-black uppercase tracking-tight">{t.name}</p>
                          <p className="text-[10px] text-zinc-500">{t.description}</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
