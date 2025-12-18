
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, ScreenShare, 
  Users, Shield, PhoneOff, Maximize2, Sparkles, UserPlus, X, Copy, Check, MoreVertical,
  Circle, Pause, Square, Download, Monitor, Globe
} from 'lucide-react';
import { User, MeetingConfig, TranscriptionEntry } from '../types';
import { GEMINI_MODEL, BRAND_NAME, ORBIT_VOICES } from '../constants';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import Dock from './Dock';
import Transcription from './Transcription';

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
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(ORBIT_VOICES[0].id);

  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
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
    micSrc.connect(dest); aiSrc.connect(dest);
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
        systemInstruction: `You are Orbit AI, a 10x better communication intelligence for ${user.name}. 
        Target Language: ${config.targetLanguage}.
        CRITICAL: Mirror the emotional state, tone, and prosody of the input speaker exactly. 
        If they sound lonely, respond with a gentle, empathetic voice. If they are excited, be energetic. 
        Transcribe and translate with perfect character-sync.`
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
          if (msg.serverContent?.inputTranscription) setActiveTranscription(msg.serverContent.inputTranscription.text);
          if (msg.serverContent?.outputTranscription) setActiveTranscription(msg.serverContent.outputTranscription.text);
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
            setTranscriptions(p => [...p, { id: Date.now().toString(), text: activeTranscription, sender: 'user', timestamp: Date.now() }]);
            setActiveTranscription('');
          }
        }
      }
    });
    sessionRef.current = await sessionPromise;
  }, [config.targetLanguage, isMuted, selectedVoice, user.name]);

  // Restart session when voice changes
  useEffect(() => {
    if (localStreamRef.current) setupOrbitLive(localStreamRef.current);
  }, [selectedVoice, setupOrbitLive]);

  // Total grid items calculation for the dynamic layout grid
  const totalGridItems = 1 + (isSharingScreen ? 1 : 0) + participants.length;

  return (
    <div className="h-screen w-full relative flex flex-col overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-6 z-40 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3">
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]"></div>
             <span className="font-mono text-xs font-bold opacity-80 uppercase tracking-widest">Orbit ID: {config.roomId}</span>
          </div>
          {isRecording && <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/30 px-4 py-2 rounded-2xl text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
            REC {Math.floor(recordingTime/60)}:{(recordingTime%60).toString().padStart(2,'0')}
          </div>}
        </div>
        <div className="pointer-events-auto">
          <button onClick={onLeave} className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all">End Session</button>
        </div>
      </div>

      <div className="flex-1 p-4 pb-32 pt-24 grid gap-4 transition-all duration-500">
        <div className={`grid gap-4 h-full ${totalGridItems <= 1 ? 'grid-cols-1' : totalGridItems <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
           {isSharingScreen && (
             <div className="col-span-1 md:col-span-2 relative bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-blue-500/20 overflow-hidden">
               <video ref={screenShareVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
               <div className="absolute bottom-4 left-4 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                 <Monitor className="w-4 h-4 text-blue-400" /> Screen Share
               </div>
             </div>
           )}
           <div className="relative bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden group">
             <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`} />
             {isVideoOff && <div className="absolute inset-0 flex items-center justify-center bg-zinc-950"><div className="w-32 h-32 bg-blue-500/10 rounded-full flex items-center justify-center text-4xl font-bold text-blue-500">{user.name[0]}</div></div>}
             <div className="absolute bottom-4 left-4 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold">{user.name} (You)</div>
           </div>
           {participants.map(p => (
             <div key={p.id} className="relative bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden">
               <img src={`https://picsum.photos/seed/${p.id}/800/600`} className="w-full h-full object-cover" alt={p.name} />
               <div className="absolute bottom-4 left-4 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold">{p.name}</div>
             </div>
           ))}
        </div>
      </div>

      <Transcription activeText={activeTranscription} history={transcriptions} speakerName={user.name} />

      <Dock 
        isMuted={isMuted} onMuteToggle={() => setIsMuted(!isMuted)}
        isVideoOff={isVideoOff} onVideoToggle={() => setIsVideoOff(!isVideoOff)}
        targetLanguage={config.targetLanguage}
        onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
        isParticipantsActive={isParticipantsOpen}
        participantCount={participants.length + 1}
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        isSharingScreen={isSharingScreen}
        onScreenShareToggle={() => isSharingScreen ? stopScreenShare() : startScreenShare()}
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
      />
    </div>
  );
};

export default MeetingRoom;
