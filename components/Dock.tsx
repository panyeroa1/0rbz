
// Fix SidebarTab import; it is exported from types.ts, not constants.ts
import React, { useState } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, ScreenShare, 
  MessageSquare, Users, Settings, Smile, Layout,
  Circle, Square, MonitorOff, ChevronUp, Globe,
  Zap, Presentation, ListTodo, BarChart3, Hand
} from 'lucide-react';
import { ORBIT_VOICES } from '../constants';
import { SidebarTab } from '../types';

interface DockProps {
  isMuted: boolean;
  onMuteToggle: () => void;
  isVideoOff: boolean;
  onVideoToggle: () => void;
  targetLanguage: string;
  isParticipantsActive: boolean;
  participantCount: number;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isSharingScreen: boolean;
  onScreenShareToggle: () => void;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  activeSidebarTab: SidebarTab | null;
  onSidebarToggle: (tab: SidebarTab) => void;
  onRaiseHand: () => void;
  isHandRaised: boolean;
}

const Dock: React.FC<DockProps> = ({ 
  isMuted, onMuteToggle, isVideoOff, onVideoToggle, targetLanguage,
  isParticipantsActive, participantCount,
  isRecording, onStartRecording, onStopRecording,
  isSharingScreen, onScreenShareToggle,
  selectedVoice, onVoiceChange,
  activeSidebarTab, onSidebarToggle,
  onRaiseHand, isHandRaised
}) => {
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);

  const activeVoiceObj = ORBIT_VOICES.find(v => v.id === selectedVoice);

  const sidebarTools: {id: SidebarTab, icon: any, color: string}[] = [
    { id: 'ai', icon: Zap, color: 'text-yellow-400' },
    { id: 'tasks', icon: ListTodo, color: 'text-blue-400' },
    { id: 'whiteboard', icon: Presentation, color: 'text-green-400' },
    { id: 'polls', icon: BarChart3, color: 'text-purple-400' }
  ];

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full flex justify-center px-4 pointer-events-none">
      <div className="relative flex items-center gap-2 bg-black/40 backdrop-blur-3xl border border-white/10 p-2 rounded-[32px] shadow-2xl pointer-events-auto">
        
        {/* Main Controls */}
        <div className="flex items-center gap-1">
          <button onClick={onMuteToggle} className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500 shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]' : 'hover:bg-white/10'}`}>
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <button onClick={onVideoToggle} className={`p-4 rounded-2xl transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10'}`}>
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
          <button onClick={onRaiseHand} className={`p-4 rounded-2xl transition-all ${isHandRaised ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10'}`}>
            <Hand className="w-6 h-6" />
          </button>
        </div>

        <div className="w-px h-8 bg-white/10 mx-1"></div>

        {/* Premium Tools Hub */}
        <div className="flex items-center gap-1 bg-white/5 px-2 rounded-2xl py-1 border border-white/5">
           {sidebarTools.map(tool => (
             <button 
              key={tool.id} onClick={() => onSidebarToggle(tool.id)}
              className={`p-3 rounded-xl transition-all ${activeSidebarTab === tool.id ? 'bg-white/10 shadow-lg' : 'hover:bg-white/5 opacity-60 hover:opacity-100'}`}
             >
               <tool.icon className={`w-5 h-5 ${tool.color}`} />
             </button>
           ))}
        </div>

        <div className="w-px h-8 bg-white/10 mx-1"></div>

        {/* AI Voice & Session */}
        <div className="relative group">
          <button 
            onClick={() => setShowVoiceMenu(!showVoiceMenu)}
            className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Orbit Voice</span>
              <span className="text-sm font-bold text-white leading-tight">{activeVoiceObj?.alias}</span>
            </div>
            <ChevronUp className={`w-4 h-4 text-zinc-500 transition-transform ${showVoiceMenu ? 'rotate-180' : ''}`} />
          </button>

          {showVoiceMenu && (
            <div className="absolute bottom-full mb-4 left-0 w-64 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-3 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 px-2">Voice Frequency</h3>
              <div className="space-y-1">
                {ORBIT_VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { onVoiceChange(v.id); setShowVoiceMenu(false); }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedVoice === v.id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'hover:bg-white/5 text-zinc-400'}`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold">{v.alias}</span>
                      <span className="text-[9px] opacity-60 uppercase">{v.metal} Nucleus</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-white/10 mx-1"></div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button onClick={() => onSidebarToggle('participants')} className={`p-4 rounded-2xl transition-all relative ${activeSidebarTab === 'participants' ? 'text-blue-400 bg-blue-500/10' : 'hover:bg-white/10'}`}>
            <Users className="w-6 h-6" />
            {participantCount > 0 && <span className="absolute top-3 right-3 w-4 h-4 bg-blue-600 text-[9px] font-bold rounded-full flex items-center justify-center border border-white/20 shadow-lg">{participantCount}</span>}
          </button>
          
          <button onClick={onScreenShareToggle} className={`p-4 rounded-2xl transition-all ${isSharingScreen ? 'bg-blue-500/20 text-blue-500' : 'hover:bg-white/10'}`}>
            {isSharingScreen ? <MonitorOff className="w-6 h-6" /> : <ScreenShare className="w-6 h-6" />}
          </button>

          <button 
            onClick={isRecording ? onStopRecording : onStartRecording}
            className={`p-4 rounded-2xl transition-all group ${isRecording ? 'bg-red-500/20' : 'hover:bg-white/10'}`}
          >
            {isRecording ? <Square className="w-6 h-6 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" /> : <Circle className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dock;
