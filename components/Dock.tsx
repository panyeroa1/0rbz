
import React, { useState } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, ScreenShare, 
  MessageSquare, Users, Hand, Shield, Grid, 
  Settings, Smile, MoreVertical, Layout
} from 'lucide-react';

interface DockProps {
  isMuted: boolean;
  onMuteToggle: () => void;
  isVideoOff: boolean;
  onVideoToggle: () => void;
  targetLanguage: string;
  onToggleParticipants: () => void;
  isParticipantsActive: boolean;
  participantCount: number;
}

const Dock: React.FC<DockProps> = ({ 
  isMuted, 
  onMuteToggle, 
  isVideoOff, 
  onVideoToggle, 
  targetLanguage,
  onToggleParticipants,
  isParticipantsActive,
  participantCount
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const items = [
    { id: 1, name: 'Mute', icon: isMuted ? MicOff : Mic, color: isMuted ? 'text-red-500' : 'text-white', action: onMuteToggle, bg: isMuted ? 'bg-red-500/10' : 'bg-transparent' },
    { id: 2, name: 'Video', icon: isVideoOff ? VideoOff : Video, color: isVideoOff ? 'text-red-500' : 'text-white', action: onVideoToggle, bg: isVideoOff ? 'bg-red-500/10' : 'bg-transparent' },
    { id: 3, name: 'Share', icon: ScreenShare, color: 'text-white', action: () => {}, bg: 'bg-transparent' },
    { id: 4, name: 'Layout', icon: Layout, color: 'text-white', action: () => {}, bg: 'bg-transparent' },
    { id: 5, name: 'Chat', icon: MessageSquare, color: 'text-white', action: () => {}, bg: 'bg-transparent', badge: 0 },
    { id: 6, name: 'People', icon: Users, color: isParticipantsActive ? 'text-blue-400' : 'text-white', action: onToggleParticipants, bg: isParticipantsActive ? 'bg-blue-500/10' : 'bg-transparent', badge: participantCount },
    { id: 7, name: 'React', icon: Smile, color: 'text-white', action: () => {}, bg: 'bg-transparent' },
    { id: 8, name: 'Settings', icon: Settings, color: 'text-white', action: () => {}, bg: 'bg-transparent' },
  ];

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[32px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative bg-black/60 backdrop-blur-3xl border border-white/10 px-4 py-3 rounded-[28px] flex items-center gap-1.5 shadow-2xl">
          {items.map((item, index) => {
            const Icon = item.icon;
            const isHovered = hoveredIndex === index;
            const isNeighbor = hoveredIndex !== null && Math.abs(hoveredIndex - index) === 1;
            
            return (
              <button
                key={item.id}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={item.action}
                style={{
                    transform: isHovered ? 'scale(1.25) translateY(-8px)' : isNeighbor ? 'scale(1.1) translateY(-4px)' : 'scale(1)',
                    transition: 'all 0.2s cubic-bezier(0.17, 0.67, 0.83, 0.67)'
                }}
                className={`
                  relative p-4 rounded-2xl flex items-center justify-center
                  hover:bg-white/10 transition-colors
                  ${item.bg}
                `}
              >
                <Icon className={`w-6 h-6 ${item.color}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-2 right-2 min-w-[18px] h-[18px] bg-blue-500 text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-black px-1">
                    {item.badge}
                  </span>
                )}
                
                {isHovered && (
                   <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-black text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 animate-in fade-in slide-in-from-bottom-2 duration-200 fill-mode-forwards shadow-xl">
                     {item.name}
                   </div>
                )}
              </button>
            );
          })}
          
          <div className="w-px h-8 bg-white/10 mx-2"></div>
          
          <div className="flex items-center gap-3 pr-2 pl-2">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-tighter">AI Translating to</span>
              <span className="text-xs font-bold text-white uppercase">{targetLanguage}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dock;
