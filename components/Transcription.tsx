
import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, History, MessageSquare, Sparkles } from 'lucide-react';
import { TranscriptionEntry } from '../types';

interface TranscriptionProps {
  activeText: string;
  history: TranscriptionEntry[];
  speakerName: string;
}

const Transcription: React.FC<TranscriptionProps> = ({ activeText, history, speakerName }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll history when expanded
  useEffect(() => {
    if (isExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, activeText, isExpanded]);

  if (!activeText && history.length === 0) return null;

  const renderActiveContent = () => {
    if (!activeText) return null;

    if (!isExpanded) {
      return (
        <>
          {activeText}
          <span className="inline-block w-1 h-5 bg-blue-500 ml-1 animate-pulse rounded-full align-middle"></span>
        </>
      );
    }

    // When expanded (not collapsed), we highlight the last character subtly
    const chars = activeText.split('');
    return (
      <>
        {chars.map((char, i) => {
          const isLast = i === chars.length - 1;
          return (
            <span 
              key={i} 
              className={isLast ? "text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all duration-75 brightness-125" : "transition-colors duration-500"}
            >
              {char}
            </span>
          );
        })}
        <span className="inline-block w-1 h-5 bg-blue-500 ml-1 animate-pulse rounded-full align-middle"></span>
      </>
    );
  };

  return (
    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-30 pointer-events-none">
      <div className="pointer-events-auto group">
        <div className={`
          bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ease-in-out
          ${isExpanded ? 'max-h-[400px]' : 'max-h-[120px]'}
        `}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-2 border-b border-white/5 bg-white/5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Eburon Live AI</span>
              </div>
              {isExpanded && (
                <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                  <History className="w-3 h-3" /> History
                </span>
              )}
            </div>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors text-zinc-400"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {/* Content Area */}
          <div 
            ref={scrollRef}
            className={`
              p-5 overflow-y-auto custom-scrollbar
              ${isExpanded ? 'h-[300px]' : ''}
            `}
          >
            {/* History Items (only when expanded) */}
            {isExpanded && history.map((entry, idx) => (
              <div key={entry.id} className="mb-4 opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-blue-500/80 uppercase">{entry.sender === 'user' ? speakerName : 'Eburon AI'}</span>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed font-mono">
                  {entry.text}
                </p>
              </div>
            ))}

            {/* Active Transcription */}
            {activeText && (
              <div className={`${isExpanded ? 'mt-6 pt-6 border-t border-white/5' : ''}`}>
                {!isExpanded && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                       <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">{speakerName} speaking...</span>
                  </div>
                )}
                <p className={`
                  text-lg md:text-xl font-medium leading-snug text-white/95 font-mono tracking-tight
                  ${!isExpanded ? 'line-clamp-2' : ''}
                `}>
                  {renderActiveContent()}
                </p>
              </div>
            )}
            
            {!activeText && !isExpanded && history.length > 0 && (
               <p className="text-zinc-500 text-sm italic font-mono line-clamp-2">
                 Last: {history[history.length - 1].text}
               </p>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default Transcription;
