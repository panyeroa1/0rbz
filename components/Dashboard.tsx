
import React, { useState } from 'react';
import { Plus, Video, Calendar, LogOut, ChevronRight, Globe2, Loader2, Orbit } from 'lucide-react';
import { User, MeetingConfig } from '../types';
import { BRAND_NAME, LANGUAGES } from '../constants';
import { supabase } from '../services/supabase';

interface DashboardProps {
  user: User;
  onJoinMeeting: (config: MeetingConfig) => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onJoinMeeting, onLogout }) => {
  const [targetLang, setTargetLang] = useState('es');
  const [meetingId, setMeetingId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const createMeeting = async () => {
    setIsProcessing(true);
    const id = Math.random().toString(36).substring(7).toUpperCase();
    onJoinMeeting({ roomId: id, isHost: true, audioEnabled: true, videoEnabled: true, targetLanguage: targetLang });
  };

  return (
    <div className="min-h-screen p-8 lg:p-16 flex flex-col">
      <div className="flex justify-between items-center mb-16">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-600 rounded-xl shadow-[0_0_15px_#3b82f688]">
            <Orbit className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">{BRAND_NAME}</h1>
        </div>
        <div className="flex items-center gap-4 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
          <img src={`https://picsum.photos/seed/${user.id}/100`} className="w-8 h-8 rounded-full border border-blue-500/50" alt="" />
          <span className="text-sm font-bold">{user.name}</span>
          <button onClick={onLogout} className="p-2 hover:text-red-500 transition-colors"><LogOut className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-7xl mx-auto w-full">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={createMeeting} disabled={isProcessing}
            className="group relative aspect-[1.5/1] bg-blue-600 hover:bg-blue-500 rounded-[40px] p-10 transition-all flex flex-col justify-between overflow-hidden shadow-2xl"
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-white/30 transition-all"></div>
             <Video className="w-12 h-12 text-white" />
             <div>
               <h3 className="text-3xl font-black uppercase mb-2">Launch Session</h3>
               <p className="text-blue-100/60 font-medium">Create a persistent Orbit link</p>
             </div>
          </button>

          <div className="bg-white/5 border border-white/10 rounded-[40px] p-10 flex flex-col justify-between hover:bg-white/[0.08] transition-all">
             <Calendar className="w-12 h-12 text-zinc-500" />
             <div>
               <h3 className="text-2xl font-bold mb-2">Flight Schedule</h3>
               <p className="text-zinc-500">Plan upcoming cross-language sessions</p>
             </div>
             <button className="text-blue-500 font-bold flex items-center gap-2 mt-4">Get Started <ChevronRight className="w-4 h-4" /></button>
          </div>

          <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-[40px] p-10">
             <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><Globe2 className="w-5 h-5 text-blue-500" /> Enter Galaxy ID</h3>
             <div className="flex gap-4">
               <input 
                value={meetingId} onChange={(e) => setMeetingId(e.target.value.toUpperCase())}
                placeholder="ORBIT-123X" className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-8 py-5 text-xl font-mono focus:ring-2 focus:ring-blue-500 outline-none" 
               />
               <button className="bg-white text-black px-10 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">Join</button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-[40px] p-10">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-6">Translation Core</h3>
             <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase">Input Stream Emotion</label>
                 <div className="flex items-center gap-2 p-4 bg-black/40 rounded-2xl border border-white/5">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                   <span className="text-xs font-bold uppercase">Active Mirroring</span>
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase">Target Language</label>
                 <select 
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none cursor-pointer hover:bg-black/60 transition-all"
                  value={targetLang} onChange={e => setTargetLang(e.target.value)}
                 >
                   {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                 </select>
               </div>
             </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-white/5 rounded-[40px] p-8">
            <h4 className="text-xs font-black uppercase text-zinc-400 mb-2">Orbit Tip</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">Gemini 2.5 Live detects emotional tone. If the user sounds lonely, the Orbit Goddess voice will match that empathy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
