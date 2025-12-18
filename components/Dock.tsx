
import React, { useState } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, ScreenShare, 
  MessageSquare, Users, Settings, Smile, Layout,
  Circle, Square, MonitorOff, ChevronUp, Globe
} from 'lucide-react';
import { ORBIT_VOICES } from '../constants';

interface DockProps {
  isMuted: boolean;
  onMuteToggle: () => void;
  isVideoOff: boolean;
  onVideoToggle: () => void;
  targetLanguage: string;
  onToggleParticipants: () => void;
  isParticipantsActive: boolean;
  participantCount: number;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isSharingScreen: boolean;
  onScreenShareToggle: () => void;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
}

const Dock: React.FC<DockProps> = ({ 
  isMuted, onMuteToggle, isVideoOff, onVideoToggle, targetLanguage,
  onToggleParticipants, isParticipantsActive, participantCount,
  isRecording, onStartRecording, onStopRecording,
  isSharingScreen, onScreenShareToggle,
  selectedVoice, onVoiceChange
}) => {
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);

  const activeVoiceObj = ORBIT_VOICES.find(v => v.id === selectedVoice);

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-full flex justify-center px-4">
      <div className="relative flex items-center gap-2 bg-black/40 backdrop-blur-3xl border border-white/10 p-2 rounded-[32px] shadow-2xl">
        
        {/* Main Controls */}
        <div className="flex items-center gap-1">
          <button onClick={onMuteToggle} className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10'}`}>
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <button onClick={onVideoToggle} className={`p-4 rounded-2xl transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10'}`}>
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
          <button onClick={onScreenShareToggle} className={`p-4 rounded-2xl transition-all ${isSharingScreen ? 'bg-blue-500/20 text-blue-500' : 'hover:bg-white/10'}`}>
            {isSharingScreen ? <MonitorOff className="w-6 h-6" /> : <ScreenShare className="w-6 h-6" />}
          </button>
        </div>

        <div className="w-px h-8 bg-white/10 mx-1"></div>

        {/* AI Voice Selector */}
        <div className="relative group">
          <button 
            onClick={() => setShowVoiceMenu(!showVoiceMenu)}
            className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">AI Voice</span>
              <span className="text-sm font-bold text-white leading-tight">{activeVoiceObj?.alias}</span>
            </div>
            <ChevronUp className={`w-4 h-4 text-zinc-500 transition-transform ${showVoiceMenu ? 'rotate-180' : ''}`} />
          </button>

          {showVoiceMenu && (
            <div className="absolute bottom-full mb-4 left-0 w-64 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-3 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 px-2">Greek Goddess Frequency</h3>
              <div className="space-y-1">
                {ORBIT_VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { onVoiceChange(v.id); setShowVoiceMenu(false); }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedVoice === v.id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'hover:bg-white/5 text-zinc-400'}`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold">{v.alias}</span>
                      <span className="text-[10px] opacity-60 uppercase">{v.metal} Nucleus</span>
                    </div>
                    {selectedVoice === v.id && <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></div>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-white/10 mx-1"></div>

        {/* Recording & Secondary */}
        <div className="flex items-center gap-1">
          <button onClick={onToggleParticipants} className={`p-4 rounded-2xl transition-all relative ${isParticipantsActive ? 'text-blue-400 bg-blue-500/10' : 'hover:bg-white/10'}`}>
            <Users className="w-6 h-6" />
            {participantCount > 0 && <span className="absolute top-3 right-3 w-4 h-4 bg-blue-600 text-[10px] font-bold rounded-full flex items-center justify-center">{participantCount}</span>}
          </button>
          
          <div className="w-px h-8 bg-white/10 mx-1"></div>

          <button 
            onClick={isRecording ? onStopRecording : onStartRecording}
            className={`p-4 rounded-2xl transition-all group ${isRecording ? 'bg-red-500/20' : 'hover:bg-white/10'}`}
          >
            {isRecording ? <Square className="w-6 h-6 text-red-500" /> : <Circle className="w-6 h-6 text-red-500 group-hover:scale-110" />}
          </button>
        </div>

        {/* Translation Indicator */}
        <div className="flex flex-col items-end px-4 border-l border-white/10 ml-1">
           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Translation</span>
           <div className="flex items-center gap-1.5">
             <Globe className="w-3 h-3 text-blue-500" />
             <span className="text-sm font-black text-white uppercase">{targetLanguage}</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dock;
