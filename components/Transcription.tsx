
import React from 'react';

interface TranscriptionProps {
  text: string;
}

const Transcription: React.FC<TranscriptionProps> = ({ text }) => {
  if (!text) return null;

  return (
    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8 z-30 pointer-events-none">
      <div className="flex justify-center">
        <div className="bg-black/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-2xl relative">
          {/* Subtle AI branding */}
          <div className="absolute -top-2 left-6 bg-blue-600 text-[8px] font-extrabold text-white px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/20">
            Eburon Live AI
          </div>
          
          <div className="flex gap-4 items-start">
             <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img src="https://picsum.photos/seed/you/100" className="w-full h-full object-cover opacity-50" />
             </div>
             <p className="text-xl md:text-2xl font-medium leading-tight text-white/90 font-mono tracking-tight transition-all duration-75">
               {text}
               <span className="inline-block w-1 h-6 bg-blue-500 ml-1 animate-pulse rounded-full align-middle"></span>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transcription;