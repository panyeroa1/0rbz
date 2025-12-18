
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, ScreenShare, 
  MessageSquare, Users, Hand, Shield, Grid, 
  PhoneOff, MoreVertical, Globe, Settings,
  MessageCircle, Sparkles, Smile, Maximize2,
  Plus, Copy, Check, UserPlus, X, Search
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
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
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

  const setupGeminiLive = useCallback(async (stream: MediaStream) => {
    if (!process.env.API_KEY) return;
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let currentInput = '';

    const sessionPromise = ai.live.connect({
      model: GEMINI_MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: `You are Eburon AI, a world-class translation and transcription engine. 
        The current user's target language is ${config.targetLanguage}. 
        When translating, maintain the nuance, tone, and professional character of the speaker.
        Translate and transcribe accurately.`
      },
      callbacks: {
        onopen: () => {
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
  const toggleParticipants = () => setIsParticipantsOpen(!isParticipantsOpen);

  const copyInviteLink = () => {
    const inviteLink = `https://eburon.ai/join/${config.roomId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="h-screen w-full bg-[#050505] flex flex-col relative overflow-hidden select-none">
      
      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full p-6 z-40 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-lg">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="font-mono text-xs uppercase tracking-widest font-bold opacity-80">Room: {config.roomId}</span>
          </div>
          <div className="hidden sm:flex bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl items-center gap-3 shadow-lg">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-xs font-bold opacity-80">Eburon Secure</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 pointer-events-auto">
           <button className="p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 transition-colors shadow-lg">
              <Maximize2 className="w-5 h-5" />
           </button>
           <button onClick={onLeave} className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all font-bold flex items-center gap-2 shadow-lg shadow-red-500/5">
              <PhoneOff className="w-4 h-4" />
              End Call
           </button>
        </div>
      </div>

      <div className="flex-1 flex w-full h-full overflow-hidden">
        {/* Main Video Area */}
        <div className={`flex-1 p-4 pb-28 pt-24 grid gap-4 transition-all duration-500 ease-in-out ${isParticipantsOpen ? 'pr-2' : ''} ${participants.length + 1 <= 1 ? 'grid-cols-1' : participants.length + 1 <= 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {/* Local Participant */}
          <div className="relative group overflow-hidden bg-zinc-900 rounded-3xl border border-white/5 shadow-2xl h-full flex items-center justify-center">
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
            <div key={p.id} className="relative group overflow-hidden bg-zinc-900 rounded-3xl border border-white/5 shadow-2xl h-full flex items-center justify-center">
              <img 
                src={`https://picsum.photos/seed/${p.id}/800/600`} 
                className="w-full h-full object-cover rounded-3xl opacity-80 group-hover:scale-105 transition-transform duration-700" 
                alt={p.name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                <span className="text-sm font-semibold">{p.name}</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          ))}
          
          {/* Invite Placeholder */}
          <div 
            onClick={toggleParticipants}
            className="bg-zinc-900/40 border-2 border-dashed border-zinc-800 rounded-3xl flex items-center justify-center group cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-zinc-800 group-hover:bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300">
                <UserPlus className="text-zinc-500 group-hover:text-blue-500 w-8 h-8" />
              </div>
              <p className="text-zinc-500 group-hover:text-blue-400 font-bold text-sm tracking-wide">INVITE OTHERS</p>
            </div>
          </div>
        </div>

        {/* Participant List Sidebar */}
        <div className={`fixed lg:relative top-0 right-0 h-full bg-[#0A0A0A]/95 backdrop-blur-3xl border-l border-white/5 transition-all duration-500 ease-in-out z-50 overflow-hidden flex flex-col ${isParticipantsOpen ? 'w-full sm:w-80 opacity-100' : 'w-0 opacity-0'}`}>
          <div className="p-6 flex items-center justify-between border-b border-white/5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              People
              <span className="ml-2 px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-full">{participants.length + 1}</span>
            </h2>
            <button onClick={toggleParticipants} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Local User */}
            <div className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
              <div className="relative">
                <img src={`https://picsum.photos/seed/${user.id}/100`} className="w-10 h-10 rounded-full ring-2 ring-blue-500/20" alt="Me" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#0A0A0A] rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold flex items-center gap-2">
                  {user.name}
                  <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md uppercase tracking-tighter">ME</span>
                </div>
                <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-blue-400" /> Host
                </div>
              </div>
              <div className="flex gap-2">
                {isMuted ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4 text-blue-400" />}
              </div>
            </div>

            {/* Others */}
            {participants.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-colors group">
                <div className="relative">
                  <img src={`https://picsum.photos/seed/${p.id}/100`} className="w-10 h-10 rounded-full" alt={p.name} />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#0A0A0A] rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{p.name}</div>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" /> AI Translating
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-1.5 hover:bg-zinc-800 rounded-lg">
                      <MoreVertical className="w-4 h-4 text-zinc-400" />
                   </button>
                </div>
              </div>
            ))}
          </div>

          {/* Invitation Section */}
          <div className="p-6 bg-zinc-950/50 border-t border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Invite to meeting</h3>
            <div className="flex items-center gap-2 p-2 bg-black rounded-xl border border-white/5">
               <span className="flex-1 text-[10px] font-mono text-zinc-500 truncate ml-2">eburon.ai/{config.roomId}</span>
               <button 
                onClick={copyInviteLink}
                className={`p-2 rounded-lg transition-all ${copySuccess ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}
               >
                 {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
               </button>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/10">
              <UserPlus className="w-4 h-4" />
              Invite Contacts
            </button>
          </div>
        </div>
      </div>

      {/* Transcription Overlay */}
      <Transcription text={activeTranscription} />

      {/* Dock Component */}
      <Dock 
        isMuted={isMuted} 
        onMuteToggle={toggleMute}
        isVideoOff={isVideoOff}
        onVideoToggle={toggleVideo}
        targetLanguage={config.targetLanguage}
        onToggleParticipants={toggleParticipants}
        isParticipantsActive={isParticipantsOpen}
        participantCount={participants.length + 1}
      />
    </div>
  );
};

export default MeetingRoom;