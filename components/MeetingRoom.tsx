import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, ScreenShare, 
  Users, Shield, PhoneOff, Maximize2, Sparkles, UserPlus, X, Copy, Check, MoreVertical,
  Circle, Pause, Square, Download
} from 'lucide-react';
import { User, MeetingConfig, TranscriptionEntry } from '../types';
import { GEMINI_MODEL, BRAND_NAME } from '../constants';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import Dock from './Dock';
import Transcription from './Transcription';

// Media utility helpers for Browser PCM
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [participants, setParticipants] = useState<User[]>([
    { id: '2', name: 'Dr. Sarah Smith', email: 'sarah@example.com' },
    { id: '3', name: 'Liam Chen', email: 'liam@example.com' }
  ]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Initialize Local Video and Gemini Live
  useEffect(() => {
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 }, 
          audio: true 
        });
        localStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setupEburonLive(stream);
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    }
    init();
    return () => {
      stopRecording();
      if (sessionRef.current) sessionRef.current.close();
      if (inputAudioCtxRef.current) inputAudioCtxRef.current.close();
      if (outputAudioCtxRef.current) outputAudioCtxRef.current.close();
    };
  }, []);

  // Recording Logic
  const startRecording = useCallback(() => {
    if (!localStreamRef.current || !outputAudioCtxRef.current) return;

    // Create a destination for the AI audio to be mixed into the recording
    if (!audioDestinationRef.current) {
      audioDestinationRef.current = outputAudioCtxRef.current.createMediaStreamDestination();
    }

    const mixedStream = new MediaStream();
    
    // Add local video track
    localStreamRef.current.getVideoTracks().forEach(track => mixedStream.addTrack(track));
    
    // Create an audio context to mix the local mic and AI voice
    const mixContext = new AudioContext();
    const micSource = mixContext.createMediaStreamSource(localStreamRef.current);
    const aiSource = mixContext.createMediaStreamSource(audioDestinationRef.current.stream);
    const destination = mixContext.createMediaStreamDestination();
    
    micSource.connect(destination);
    aiSource.connect(destination);
    
    // Add mixed audio track
    destination.stream.getAudioTracks().forEach(track => mixedStream.addTrack(track));

    const recorder = new MediaRecorder(mixedStream, { mimeType: 'video/webm;codecs=vp9,opus' });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Eburon-Meeting-${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      recordedChunksRef.current = [];
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setIsRecordingPaused(false);
    setRecordingTime(0);
    
    timerIntervalRef.current = window.setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsRecordingPaused(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsRecordingPaused(false);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsRecordingPaused(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  }, []);

  const setupEburonLive = useCallback(async (stream: MediaStream) => {
    if (!process.env.API_KEY) return;
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let currentInputBuffer = '';
    let currentOutputBuffer = '';

    const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    inputAudioCtxRef.current = inCtx;
    outputAudioCtxRef.current = outCtx;

    // Create the destination for recording
    audioDestinationRef.current = outCtx.createMediaStreamDestination();

    const sessionPromise = ai.live.connect({
      model: GEMINI_MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        },
        systemInstruction: `You are Eburon AI, the core intelligence for the Eburon communication platform. 
        Your user is ${user.name}. The meeting target language nuance is ${config.targetLanguage}. 
        Provide seamless translation and character-perfect transcription. Ensure output audio matches transcribed text precisely.`
      },
      callbacks: {
        onopen: () => {
          console.debug('[Eburon Live] Session Connected');
          const source = inCtx.createMediaStreamSource(stream);
          const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (e) => {
            if (isMuted) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) {
              int16[i] = inputData[i] * 32768;
            }
            
            sessionPromise.then(s => {
              s.sendRealtimeInput({
                media: {
                  data: encode(new Uint8Array(int16.buffer)),
                  mimeType: 'audio/pcm;rate=16000'
                }
              });
            });
          };
          
          source.connect(scriptProcessor);
          scriptProcessor.connect(inCtx.destination);
        },
        onmessage: async (msg: LiveServerMessage) => {
          // Handle Input Transcription (User speaking)
          if (msg.serverContent?.inputTranscription) {
            const text = msg.serverContent.inputTranscription.text;
            currentInputBuffer += text;
            setActiveTranscription(currentInputBuffer);
          }

          // Handle Output Transcription (Model speaking)
          if (msg.serverContent?.outputTranscription) {
            const text = msg.serverContent.outputTranscription.text;
            currentOutputBuffer += text;
            setActiveTranscription(currentOutputBuffer);
          }

          // Handle Model Audio Output
          const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio && outCtx && audioDestinationRef.current) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
            
            const source = outCtx.createBufferSource();
            source.buffer = audioBuffer;
            
            // Gain Node for smooth transitions (Eliminate Clicks)
            const gainNode = outCtx.createGain();
            const rampTime = 0.01; // 10ms ramp
            
            gainNode.gain.setValueAtTime(0, nextStartTimeRef.current);
            gainNode.gain.linearRampToValueAtTime(1, nextStartTimeRef.current + rampTime);
            gainNode.gain.setValueAtTime(1, nextStartTimeRef.current + audioBuffer.duration - rampTime);
            gainNode.gain.linearRampToValueAtTime(0, nextStartTimeRef.current + audioBuffer.duration);

            source.connect(gainNode);
            // Connect to both speakers and recording destination
            gainNode.connect(outCtx.destination);
            gainNode.connect(audioDestinationRef.current);
            
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
          }

          // Handle Turn Completion
          if (msg.serverContent?.turnComplete) {
            const finalTxt = currentInputBuffer || currentOutputBuffer;
            const sender = currentInputBuffer ? 'user' : 'model';
            
            if (finalTxt) {
              setTranscriptions(prev => [
                ...prev, 
                { id: Date.now().toString(), text: finalTxt, sender, timestamp: Date.now() }
              ]);
            }
            currentInputBuffer = '';
            currentOutputBuffer = '';
            setActiveTranscription('');
          }
        },
        onerror: (e) => console.error("[Eburon Live] Error:", e),
        onclose: (e) => console.debug("[Eburon Live] Connection Closed:", e.reason)
      }
    });

    sessionRef.current = await sessionPromise;
  }, [config.targetLanguage, isMuted, user.name]);

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleVideo = () => setIsVideoOff(!isVideoOff);
  const toggleParticipants = () => setIsParticipantsOpen(!isParticipantsOpen);

  const copyInviteLink = () => {
    const inviteLink = `https://eburon.ai/join/${config.roomId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          
          {isRecording && (
             <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-lg animate-in fade-in slide-in-from-left-4">
                <div className={`w-2 h-2 bg-red-500 rounded-full ${isRecordingPaused ? 'opacity-50' : 'animate-pulse'}`}></div>
                <span className="text-xs font-black text-red-500 uppercase tracking-widest">REC {formatTime(recordingTime)}</span>
             </div>
          )}

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
          {participants.map((p) => (
            <div key={p.id} className="relative group overflow-hidden bg-zinc-900 rounded-3xl border border-white/5 shadow-2xl h-full flex items-center justify-center">
              <img 
                src={`https://picsum.photos/seed/${p.id}/800/600`} 
                className="w-full h-full object-cover rounded-3xl opacity-80 group-hover:scale-105 transition-transform duration-700" 
                alt={p.name}
              />
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
              <p className="text-zinc-500 group-hover:text-blue-400 font-bold text-sm tracking-wide uppercase">Invite People</p>
            </div>
          </div>
        </div>

        {/* Participant List Sidebar */}
        <div className={`fixed lg:relative top-0 right-0 h-full bg-[#0A0A0A]/95 backdrop-blur-3xl border-l border-white/5 transition-all duration-500 ease-in-out z-50 overflow-hidden flex flex-col ${isParticipantsOpen ? 'w-full sm:w-80 opacity-100' : 'w-0 opacity-0'}`}>
          <div className="p-6 flex items-center justify-between border-b border-white/5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Participants
              <span className="ml-2 px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-full">{participants.length + 1}</span>
            </h2>
            <button onClick={toggleParticipants} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
              <img src={`https://picsum.photos/seed/${user.id}/100`} className="w-10 h-10 rounded-full ring-2 ring-blue-500/20" alt="Me" />
              <div className="flex-1">
                <div className="text-sm font-bold flex items-center gap-2">
                  {user.name}
                  <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md uppercase tracking-tighter">HOST</span>
                </div>
              </div>
              {isMuted ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4 text-blue-400" />}
            </div>

            {participants.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-colors group">
                <img src={`https://picsum.photos/seed/${p.id}/100`} className="w-10 h-10 rounded-full" alt={p.name} />
                <div className="flex-1">
                  <div className="text-sm font-bold">{p.name}</div>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" /> Eburon AI Translating
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-zinc-950/50 border-t border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Share meeting link</h3>
            <div className="flex items-center gap-2 p-2 bg-black rounded-xl border border-white/5">
               <span className="flex-1 text-[10px] font-mono text-zinc-500 truncate ml-2">eburon.ai/{config.roomId}</span>
               <button onClick={copyInviteLink} className={`p-2 rounded-lg transition-all ${copySuccess ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}>
                 {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
               </button>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
              <UserPlus className="w-4 h-4" />
              Add Contacts
            </button>
          </div>
        </div>
      </div>

      <Transcription 
        activeText={activeTranscription} 
        history={transcriptions}
        speakerName={user.name}
      />

      <Dock 
        isMuted={isMuted} 
        onMuteToggle={toggleMute}
        isVideoOff={isVideoOff}
        onVideoToggle={toggleVideo}
        targetLanguage={config.targetLanguage}
        onToggleParticipants={toggleParticipants}
        isParticipantsActive={isParticipantsOpen}
        participantCount={participants.length + 1}
        isRecording={isRecording}
        isRecordingPaused={isRecordingPaused}
        onStartRecording={startRecording}
        onPauseRecording={pauseRecording}
        onStopRecording={stopRecording}
      />
    </div>
  );
};

export default MeetingRoom;