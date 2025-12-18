
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, ScreenShare, 
  Users, Shield, PhoneOff, Maximize2, Sparkles, UserPlus, X, Copy, Check, MoreVertical,
  Circle, Pause, Square, Download, Monitor, Globe2, Command, Hand, Search, Zap
} from 'lucide-react';
import { User, MeetingConfig, TranscriptionEntry, SidebarTab, Task, HandRaise } from '../types';
import { GEMINI_MODEL, BRAND_NAME, ORBIT_VOICES, LANGUAGES } from '../constants';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import Dock from './Dock';
import Transcription from './Transcription';
import Sidebar from './Sidebar';

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

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
  const [selectedVoice, setSelectedVoice] = useState(ORBIT_VOICES[0].id);

  const getDialectName = (code: string) => {
    for (const group of LANGUAGES) {
      const found = group.options.find(o => o.code === code);
      if (found) return found.name;
    }
    return code;
  };

  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [handRaises, setHandRaises] = useState<HandRaise[]>([]);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [sentiment, setSentiment] = useState('Engaged & Focused');

  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [participants] = useState<User[]>([
    { id: '2', name: 'Dr. Sarah Smith', email: 'sarah@example.com' },
    { id: '3', name: 'Liam Chen', email: 'liam@example.com' }
  ]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const activeTranscriptionRef = useRef('');

  useEffect(() => {
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
        localStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setupOrbitLive(stream);
      } catch (err) { console.error("Media error:", err); }
    }
    init();
    return () => {
      stopRecording();
      stopScreenShare();
      if (sessionRef.current) sessionRef.current.close();
      if (inputAudioCtxRef.current) inputAudioCtxRef.current.close();
      if (outputAudioCtxRef.current) outputAudioCtxRef.current.close();
    };
  }, []);

  const setupOrbitLive = useCallback(async (stream: MediaStream) => {
    if (!process.env.API_KEY) return;
    if (sessionRef.current) sessionRef.current.close();

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const inCtx = new AudioContext({ sampleRate: 16000 });
    const outCtx = new AudioContext({ sampleRate: 24000 });
    inputAudioCtxRef.current = inCtx;
    outputAudioCtxRef.current = outCtx;
    audioDestinationRef.current = outCtx.createMediaStreamDestination();

    const sessionPromise = ai.live.connect({
      model: GEMINI_MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
        systemInstruction: `You are Orbit AI Premium Facilitator. 
        Context: Meeting Template "${config.template || 'General Collaboration'}". 
        Goal: Transcribe and translate to exactly "${getDialectName(config.targetLanguage)}".
        New Duties:
        1. Maintain the agenda and conventions of the "${config.template}" template.
        2. Strictly detect speaker sentiment and provide real-time coaching via transcript tags.
        3. Character-sync all transcriptions using regional phrasing for ${getDialectName(config.targetLanguage)}.
        4. If a task is identified, format it as "[TASK: description]".
        5. Provide a summary marker if the conversation shifts topics.`
      },
      callbacks: {
        onopen: () => {
          const source = inCtx.createMediaStreamSource(stream);
          const processor = inCtx.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            if (isMuted) return;
            const input = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) int16[i] = input[i] * 32768;
            sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
          };
          source.connect(processor); processor.connect(inCtx.destination);
        },
        onmessage: async (msg: LiveServerMessage) => {
          if (msg.serverContent?.inputTranscription) {
            const text = msg.serverContent.inputTranscription.text;
            activeTranscriptionRef.current = text;
            setActiveTranscription(text);
          }
          if (msg.serverContent?.outputTranscription) {
             const text = msg.serverContent.outputTranscription.text;
             activeTranscriptionRef.current = text;
             setActiveTranscription(text);
          }
          
          const base64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64 && outCtx) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
            const buf = await decodeAudioData(decode(base64), outCtx, 24000, 1);
            const src = outCtx.createBufferSource();
            src.buffer = buf;
            const gain = outCtx.createGain();
            gain.gain.setValueAtTime(0, nextStartTimeRef.current);
            gain.gain.linearRampToValueAtTime(1, nextStartTimeRef.current + 0.01);
            gain.connect(outCtx.destination);
            gain.connect(audioDestinationRef.current!);
            src.connect(gain);
            src.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buf.duration;
          }
          
          if (msg.serverContent?.turnComplete) {
            const final = activeTranscriptionRef.current;
            setTranscriptions(p => [...p, { id: Date.now().toString(), text: final, sender: 'user', timestamp: Date.now() }]);
            setActiveTranscription('');
            activeTranscriptionRef.current = '';
          }
        }
      }
    });
    sessionRef.current = await sessionPromise;
  }, [config.targetLanguage, config.template, isMuted, selectedVoice, user.name]);

  const stopScreenShare = useCallback(() => {
    if (screenStream) { screenStream.getTracks().forEach(track => track.stop()); setScreenStream(null); }
    setIsSharingScreen(false);
  }, [screenStream]);

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setScreenStream(stream);
      setIsSharingScreen(true);
      if (screenShareVideoRef.current) screenShareVideoRef.current.srcObject = stream;
      stream.getVideoTracks()[0].onended = () => stopScreenShare();
    } catch (err) { console.error("Screen share error:", err); }
  };

  const startRecording = useCallback(() => {
    if (!localStreamRef.current || !outputAudioCtxRef.current) return;
    if (!audioDestinationRef.current) audioDestinationRef.current = outputAudioCtxRef.current.createMediaStreamDestination();
    const mixedStream = new MediaStream();
    const videoSource = isSharingScreen && screenStream ? screenStream : localStreamRef.current;
    videoSource.getVideoTracks().forEach(track => mixedStream.addTrack(track));
    
    const mixCtx = new AudioContext();
    const micSrc = mixCtx.createMediaStreamSource(localStreamRef.current);
    const aiSrc = mixCtx.createMediaStreamSource(audioDestinationRef.current.stream);
    const dest = mixCtx.createMediaStreamDestination();
    micSrc.connect(dest); 
    aiSrc.connect(dest);
    
    dest.stream.getAudioTracks().forEach(track => mixedStream.addTrack(track));
    const recorder = new MediaRecorder(mixedStream, { mimeType: 'video/webm' });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Orbit-${Date.now()}.webm`; a.click();
      recordedChunksRef.current = [];
    };
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    timerIntervalRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);
  }, [isSharingScreen, screenStream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) { mediaRecorderRef.current.stop(); setIsRecording(false); if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); }
  }, []);

  const handleRaiseHand = () => {
    if (!isHandRaised) {
      setHandRaises([...handRaises, { userId: user.id, userName: user.name, timestamp: Date.now() }]);
    } else {
      setHandRaises(handRaises.filter(h => h.userId !== user.id));
    }
    setIsHandRaised(!isHandRaised);
  };

  const totalGridItems = 1 + (isSharingScreen ? 1 : 0) + participants.length;

  return (
    <div className="h-full w-full relative flex overflow-hidden bg-black select-none">
      <div className="flex-1 flex flex-col relative transition-all duration-700 ease-in-out">
        {/* Header Branding */}
        <div className="absolute top-0 left-0 w-full p-8 z-40 flex justify-between items-center pointer-events-none">
          <div className="flex items-center gap-6 pointer-events-auto">
            <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-6 py-3 rounded-3xl flex items-center gap-4 shadow-2xl">
               <div className="relative">
                 <Zap className="w-5 h-5 text-blue-500 shadow-[0_0_15px_#3b82f6]" />
                 <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full"></div>
               </div>
               <span className="font-mono text-[11px] font-black opacity-90 uppercase tracking-[0.2em]">{config.roomId} • {config.template || 'Standard Orbit'}</span>
            </div>
            {isRecording && (
              <div className="bg-red-500/20 backdrop-blur-2xl border border-red-500/30 px-6 py-3 rounded-3xl text-[11px] font-black text-red-500 uppercase tracking-widest flex items-center gap-3 shadow-2xl">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]"></div>
                LIVE REC {Math.floor(recordingTime/60)}:{(recordingTime%60).toString().padStart(2,'0')}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 pointer-events-auto">
            <button className="p-4 bg-white/5 border border-white/10 rounded-3xl text-zinc-400 hover:text-white transition-all shadow-2xl hover:bg-white/10 active:scale-95"><UserPlus size={24}/></button>
            <button onClick={onLeave} className="px-8 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-2xl active:scale-95">End Journey</button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-6 pb-40 pt-28 grid gap-6 transition-all duration-700 overflow-hidden">
          <div className={`grid gap-6 h-full transition-all duration-700 ${totalGridItems <= 1 ? 'grid-cols-1' : totalGridItems <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
             {isSharingScreen && (
               <div className="col-span-1 md:col-span-2 relative bg-zinc-900/40 backdrop-blur-2xl rounded-[48px] border border-blue-500/40 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                 <video ref={screenShareVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
                 <div className="absolute top-6 left-6 bg-blue-600/30 backdrop-blur-3xl border border-blue-500/40 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl">
                   <Monitor className="w-5 h-5 text-blue-400" /> Voyager Projection
                 </div>
               </div>
             )}
             <div className="relative bg-zinc-900/40 backdrop-blur-2xl rounded-[48px] border border-white/5 overflow-hidden shadow-2xl group ring-1 ring-white/10">
               <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover transition-transform duration-1000 ${isVideoOff ? 'hidden' : 'group-hover:scale-105'}`} />
               {isVideoOff && (
                 <div className="absolute inset-0 flex items-center justify-center bg-[#050505]">
                   <div className="w-40 h-40 bg-blue-500/10 rounded-[48px] flex items-center justify-center text-5xl font-black text-blue-500 border-2 border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.2)]">{user.name[0]}</div>
                 </div>
               )}
               <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-2xl px-5 py-2.5 rounded-2xl border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl">{user.name} (Voyager)</div>
               {isHandRaised && <div className="absolute top-6 right-6 bg-blue-500 p-3 rounded-2xl shadow-[0_0_30px_#3b82f6] animate-bounce"><Hand className="text-white w-5 h-5" /></div>}
             </div>
             {participants.map(p => (
               <div key={p.id} className="relative bg-zinc-900/40 backdrop-blur-2xl rounded-[48px] border border-white/5 overflow-hidden shadow-2xl group ring-1 ring-white/10">
                 <img src={`https://picsum.photos/seed/${p.id}/1200/800`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={p.name} />
                 <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-2xl px-5 py-2.5 rounded-2xl border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl">{p.name}</div>
               </div>
             ))}
          </div>
        </div>

        <Transcription activeText={activeTranscription} history={transcriptions} speakerName={user.name} />

        <Dock 
          isMuted={isMuted} onMuteToggle={() => setIsMuted(!isMuted)}
          isVideoOff={isVideoOff} onVideoToggle={() => setIsVideoOff(!isVideoOff)}
          targetLanguage={config.targetLanguage}
          isParticipantsActive={activeSidebarTab === 'participants'}
          participantCount={participants.length + 1}
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          isSharingScreen={isSharingScreen}
          onScreenShareToggle={() => isSharingScreen ? stopScreenShare() : startScreenShare()}
          selectedVoice={selectedVoice}
          onVoiceChange={setSelectedVoice}
          activeSidebarTab={activeSidebarTab}
          onSidebarToggle={(tab) => setActiveSidebarTab(activeSidebarTab === tab ? null : tab)}
          onRaiseHand={handleRaiseHand}
          isHandRaised={isHandRaised}
        />
      </div>

      {activeSidebarTab && (
        <Sidebar 
          activeTab={activeSidebarTab} 
          onTabChange={setActiveSidebarTab}
          onClose={() => setActiveSidebarTab(null)}
          tasks={tasks}
          onAddTask={(text) => setTasks([...tasks, { id: Date.now().toString(), text, assignee: 'System', completed: false }])}
          onToggleTask={(id) => setTasks(tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t))}
          sentiment={sentiment}
          speakerQueue={handRaises.map(h => h.userName)}
        />
      )}
    </div>
  );
};

export default MeetingRoom;
