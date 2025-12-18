
import React, { useState } from 'react';
import { 
  Plus, 
  Video, 
  Calendar, 
  Settings, 
  LogOut, 
  Copy, 
  Check, 
  ChevronRight, 
  Globe2, 
  Monitor,
  Mic,
  LayoutGrid,
  Loader2,
  Sparkles
} from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const createMeeting = async () => {
    setIsProcessing(true);
    setError(null);
    const newRoomId = Math.random().toString(36).substring(7).toUpperCase();
    
    try {
      const { error: dbError } = await supabase
        .from('sessions')
        .insert([
          { 
            id: newRoomId, 
            creator_name: user.name,
            is_active: true
          }
        ]);

      if (dbError) throw dbError;

      onJoinMeeting({
        roomId: newRoomId,
        isHost: true,
        audioEnabled: true,
        videoEnabled: true,
        targetLanguage: targetLang
      });
    } catch (err: any) {
      console.error("Error creating session:", err);
      setError("Failed to create meeting session. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const joinExisting = async () => {
    if (!meetingId) return;
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', meetingId.toUpperCase())
        .single();

      if (dbError || !data) {
        setError("Meeting session not found or inactive.");
        setIsProcessing(false);
        return;
      }

      onJoinMeeting({
        roomId: data.id,
        isHost: data.creator_name === user.name,
        audioEnabled: true,
        videoEnabled: true,
        targetLanguage: targetLang
      });
    } catch (err: any) {
      setError("Could not find that meeting. Check the ID.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-12 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Video className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold">{BRAND_NAME}</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
               <div className="text-sm font-semibold">{user.name}</div>
               <div className="text-xs text-zinc-500">{user.email}</div>
             </div>
             <img src={`https://picsum.photos/seed/${user.id}/100`} className="w-10 h-10 rounded-full ring-2 ring-blue-500/20" alt="Avatar" />
          </div>
          <button onClick={handleLogout} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Actions */}
        <div className="lg:col-span-2 space-y-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <button 
              onClick={createMeeting}
              disabled={isProcessing}
              className="group relative h-48 bg-blue-600 hover:bg-blue-500 rounded-3xl p-8 transition-all overflow-hidden flex flex-col justify-between disabled:opacity-50"
             >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center">
                  {isProcessing ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Video className="w-8 h-8 text-white" />}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">New Meeting</h3>
                  <p className="text-blue-100/70">Start a persistent room</p>
                </div>
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                  <Plus className="w-6 h-6" />
                </div>
             </button>

             <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between">
                <div className="bg-zinc-800 w-14 h-14 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">Schedule</h3>
                  <p className="text-zinc-500">Plan your next session</p>
                </div>
                <button className="mt-4 text-blue-500 font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  Get started <ChevronRight className="w-4 h-4" />
                </button>
             </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-zinc-500" />
              Join with Code
            </h3>
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="Enter room ID (e.g. AB123)"
                className="flex-1 bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
              />
              <button 
                onClick={joinExisting}
                className="bg-zinc-800 hover:bg-zinc-700 px-8 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                disabled={!meetingId || isProcessing}
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Translation Settings */}
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-blue-500" />
              Eburon Intelligence
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900 rounded-2xl">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">AI Translation Nuance</label>
                <select 
                  className="w-full bg-transparent border-none focus:ring-0 text-white cursor-pointer font-medium"
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code} className="bg-zinc-900">
                      Translate to {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 p-4 text-sm text-zinc-400">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold ring-2 ring-black">AI</div>
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-[10px] font-bold ring-2 ring-black">LLM</div>
                </div>
                <span>Eburon Live AI enabled</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
            <h4 className="font-bold mb-2">Upcoming Meeting</h4>
            <p className="text-zinc-500 text-sm mb-4">Syncing with Eburon Sessions...</p>
            <div className="space-y-3">
              <div className="text-center py-4 text-zinc-600 text-xs italic">
                No scheduled meetings found.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
