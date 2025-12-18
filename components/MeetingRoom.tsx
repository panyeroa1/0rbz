import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, ScreenShare, 
  MessageSquare, Users, Hand, Shield, Grid, 
  PhoneOff, MoreVertical, Globe, Settings,
  MessageCircle, Sparkles, Smile, Maximize2,
  Plus
} from 'lucide-react';
import { User, MeetingConfig, TranscriptionEntry } from '../types';
import { GEMINI_MODEL, BRAND_NAME } from '../constants';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import Dock from './Dock';
import Transcription from './Transcription';

interface MeetingRoomProps {
  user: User;
  config: MeetingConfig;
  onLeave: () => void;
}

const MeetingRoom: React.FC<MeetingRoomProps> = ({ user, config, onLeave }) => {
  const [isMuted, setIsMuted] = useState(!config.audioEnabled);
  const [isVideoOff, setIsVideoOff] = useState(!config.videoEnabled);
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [activeTranscription, setActiveTranscription] = useState<string>('');
  const [participants, setParticipants] = useState<User[]>([
    { id: '2', name: 'Dr. Sarah Smith', email: 'sarah@example.com' },
    { id: '3', name: 'Liam Chen', email: 'liam@example.com' }
  ]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  
  // Initialize Local Video
  useEffect(() => {
    async function startVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setupGeminiLive(stream);
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    }
    startVideo();
    return () => {
      if (sessionRef.current) sessionRef.current.close();
    };
  }, []);

  // Fixed missing Plus import by adding it to the lucide-react imports
  const setupGeminiLive = useCallback(async (stream: MediaStream) => {
    if (!process.env.API_KEY) return;
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Transcription storage
    let currentInput = '';

    const sessionPromise = ai.live.connect({
      model: GEMINI_MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: `You are Orbit AI, a world-class translation and transcription engine. 
        The current user's target language is ${config.targetLanguage}. 
        When translating, maintain the nuance, tone, and professional character of the speaker.
        Translate and transcribe accurately.`
      },
      callbacks: {
        onopen: () => {
          console.log("Gemini Live Session Opened");
          const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          const source = inputCtx.createMediaStreamSource(stream);
          const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (e) => {
            if (isMuted) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
            
            const pcmBlob = {
              data: btoa(String.fromCharCode(...new Uint8Array(int16.buffer))),
              mimeType: 'audio/pcm;rate=16000'
            };
            
            sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
          };
          
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputCtx.destination);
          audioContextRef.current = inputCtx;
        },
        onmessage: async (msg: LiveServerMessage) => {
          if (msg.serverContent?.inputTranscription) {
            const text = msg.serverContent.inputTranscription.text;
            currentInput += text;
            setActiveTranscription(currentInput);
          }
          if (msg.serverContent?.turnComplete) {
            if (currentInput) {
              setTranscriptions(prev => [
                ...prev, 
                { id: Date.now().toString(), text: currentInput, sender: 'user', timestamp: Date.now() }
              ]);
            }
            currentInput = '';
            setActiveTranscription('');
          }
        },
        onerror: (e) => console.error("Gemini Error:", e),
        onclose: () => console.log("Gemini Connection Closed")
      }
    });

    sessionRef.current = await sessionPromise;
  }, [config.targetLanguage, isMuted]);

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleVideo = () => setIsVideoOff(!isVideoOff);

  return (
    <div className="h-screen w-full bg-[#050505] flex flex-col relative overflow-hidden select-none">
      
      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="font-mono text-xs uppercase tracking-widest font-bold opacity-80">Room: {config.roomId}</span>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-xs font-bold opacity-80">End-to-End Encrypted</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 pointer-events-auto">
           <button className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
              <Maximize2 className="w-5 h-5" />
           </button>
           <button onClick={onLeave} className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all font-bold flex items-center gap-2">
              <PhoneOff className="w-4 h-4" />
              End Call
           </button>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 p-4 pb-28 pt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Local Participant */}
        <div className="relative group overflow-hidden bg-zinc-900 rounded-3xl border border-white/5 shadow-2xl">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover rounded-3xl transition-transform duration-700 group-hover:scale-105 ${isVideoOff ? 'hidden' : ''}`}
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-gradient-to-b from-zinc-800 to-zinc-950">
               <div className="w-32 h-32 bg-blue-500/10 rounded-full flex items-center justify-center ring-4 ring-blue-500/20">
                  <span className="text-4xl font-bold text-blue-500">{user.name[0]}</span>
               </div>
               <span className="text-zinc-500 font-medium">Camera is off</span>
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
            <span className="text-sm font-semibold">{user.name} (You)</span>
            {!isMuted && <div className="flex gap-0.5 items-end h-3">
               <div className="w-1 h-2 bg-blue-400 rounded-full animate-bounce"></div>
               <div className="w-1 h-3 bg-blue-400 rounded-full animate-bounce delay-75"></div>
               <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce delay-150"></div>
            </div>}
          </div>
        </div>

        {/* Remote Participants */}
        {participants.map((p, idx) => (
          <div key={p.id} className="relative group overflow-hidden bg-zinc-900 rounded-3xl border border-white/5 shadow-2xl">
            <img 
              src={`https://picsum.photos/seed/${p.id}/800/600`} 
              className="w-full h-full object-cover rounded-3xl opacity-80 group-hover:scale-105 transition-transform duration-700" 
              alt={p.name}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-sm font-semibold">{p.name}</span>
            </div>
          </div>
        ))}
        
        {/* Placeholder for more */}
        <div className="bg-zinc-900/40 border-2 border-dashed border-zinc-800 rounded-3xl flex items-center justify-center group cursor-pointer hover:border-blue-500/50 transition-colors">
          <div className="text-center">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Plus className="text-zinc-500" />
            </div>
            <p className="text-zinc-600 font-medium text-sm">Invite Others</p>
          </div>
        </div>
      </div>

      {/* Transcription Overlay - character style fast */}
      <Transcription text={activeTranscription} />

      {/* Dock Component */}
      <Dock 
        isMuted={isMuted} 
        onMuteToggle={toggleMute}
        isVideoOff={isVideoOff}
        onVideoToggle={toggleVideo}
        targetLanguage={config.targetLanguage}
      />
    </div>
  );
};

export default MeetingRoom;