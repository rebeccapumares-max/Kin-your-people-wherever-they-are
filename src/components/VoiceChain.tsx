import React, { useState, useEffect } from 'react';
import { VoiceChain, VoiceChainMessage, FamilyMember } from '../types';
import { Radio, Volume2, History, Play, Pause, Plus, Heart, Users, Calendar, Clock, Disc, Mic } from 'lucide-react';

interface VoiceChainProps {
  chains: VoiceChain[];
  members: FamilyMember[];
  activeMemberId: string;
  onAddChain: (chain: VoiceChain) => void;
  onAddChainReply: (chainId: string, duration: number, audioUrl?: string, transcript?: string) => void;
}

export default function VoiceChainComponent({ chains, members, activeMemberId, onAddChain, onAddChainReply }: VoiceChainProps) {
  const [selectedChainId, setSelectedChainId] = useState<string | null>(chains[0]?.id || null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  
  // Real Media Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [draftAudioUrl, setDraftAudioUrl] = useState<string | null>(null);
  const [draftTranscript, setDraftTranscript] = useState<string>('');
  
  // Custom manual family audio file upload state
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Audio elements & active static hiss refs
  const [activeAudioElement, setActiveAudioElement] = useState<HTMLAudioElement | null>(null);
  const [noiseStopFn, setNoiseStopFn] = useState<(() => void) | null>(null);
  const [enableWarmHiss, setEnableWarmHiss] = useState<boolean>(true);

  // New Chain Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);

  const activeChain = chains.find(c => c.id === selectedChainId);
  const activeUser = members.find(m => m.id === activeMemberId);

  // Recording timer effect
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 180) { // 3-minute cap
            stopRecordingAndKeep();
            return 180;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Combined sequential playback simulation
  const [chainPlaying, setChainPlaying] = useState(false);
  const [playbackMsgIdx, setPlaybackMsgIdx] = useState(-1);
  const [currentSpeechText, setCurrentSpeechText] = useState<string>('');

  // Start procedural white-noise generator to mimic authentic physical cassette hiss
  const playCassetteTapeHiss = () => {
    if (!enableWarmHiss) return null;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      const ctx = new AudioContextClass();
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Very soft white noise
        output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Filter high frequencies to sound like deep warmth magnet friction
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'lowpass';
      bandpass.frequency.value = 650;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.006, ctx.currentTime); // Whisper quiet

      noiseSource.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start();

      let hasClosedHiss = false;
      return () => {
        if (hasClosedHiss) return;
        hasClosedHiss = true;
        try {
          noiseSource.stop();
        } catch (_) {}
        try {
          noiseSource.disconnect();
          bandpass.disconnect();
          gain.disconnect();
        } catch (_) {}
        try {
          if (ctx && ctx.state !== 'closed') {
            ctx.close().catch(() => {});
          }
        } catch (_) {}
      };
    } catch (_) {
      return null;
    }
  };

  // Play analog cassette deck load/unload chime
  const playRetroMessageNodeSound = (senderId: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const isElder = senderId.includes('elder') || senderId.includes('1') || senderId.includes('3');
      const baseFreqs = isElder ? [220.00, 261.63, 329.63] : [329.63, 392.00, 440.00];
      const instrument = 'sine';

      baseFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = idx * 0.12;
        osc.type = instrument;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.4);
      });

      // Securely teardown and close this short-lived tone AudioContext once the schedule has exhausted
      let toneContextClosed = false;
      setTimeout(() => {
        if (toneContextClosed) return;
        toneContextClosed = true;
        try {
          if (ctx && ctx.state !== 'closed') {
            ctx.close().catch(() => {});
          }
        } catch (_) {}
      }, 1200);
    } catch (err) {
      console.log('Synthesizer blocked:', err);
    }
  };

  // Beautiful lo-fi vocal phonetic synthesizer for default prebuilt audio messages
  // Shapes bandpass biquad filters around human vocal formant frequencies on a raw sawtooth pitch wave
  const speakMessageText = (msg: VoiceChainMessage, onComplete: () => void): (() => void) => {
    let timeouts: number[] = [];
    let activeNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
    let isCancelled = false;
    let voiceContextClosed = false;

    const senderMember = members.find(m => m.id === msg.senderId);
    const name = senderMember ? senderMember.name : 'Ancestors';
    const text = msg.transcript || `Hello family, this is ${name}'s voice tape rotation checked in.`;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        setCurrentSpeechText(text);
        const wordsCount = text.split(/\s+/).length;
        const timer = window.setTimeout(onComplete, Math.max(2000, wordsCount * 250));
        return () => clearTimeout(timer);
      }
      
      const ctx = new AudioCtxClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const safeCloseVoiceContext = () => {
        if (voiceContextClosed) return;
        voiceContextClosed = true;
        try {
          if (ctx && ctx.state !== 'closed') {
            ctx.close().catch(() => {});
          }
        } catch (_) {}
      };
      
      const words = text.split(/\s+/);
      let wordIndex = 0;

      // Register pitches & speed dynamics tailored to the family member's unique voice traits
      let basePitch = 150; // Default voice tone
      let speedMs = 210;   // Typing speed
      let oscType: OscillatorType = 'triangle'; // Warm magnetic glow
      let formantBase = [600, 1200]; // Vowel F1/F2 frequency set

      if (msg.senderId === 'nonna') {
        basePitch = 180; // Warm motherly elderly frequency
        speedMs = 280;   // Nostalgic slow pace
        oscType = 'triangle';
        formantBase = [450, 950]; 
      } else if (msg.senderId === 'laura') {
        basePitch = 240; // Cheerful cousin higher register
        speedMs = 160;   // Fluent fast chatter
        oscType = 'sine';
        formantBase = [550, 1800];
      } else if (msg.senderId === 'david') {
        basePitch = 100; // Deep brother bass register
        speedMs = 210;   // Steady cadence
        oscType = 'sawtooth';
        formantBase = [400, 1100];
      }

      const speakNextWord = () => {
        if (isCancelled || voiceContextClosed || ctx.state === 'closed') return;

        if (wordIndex < words.length) {
          const currentWord = words[wordIndex];
          const visibleSubset = words.slice(0, wordIndex + 1).join(' ');
          setCurrentSpeechText(visibleSubset);

          // Web Audio custom vocal syllable chirp
          try {
            const charCount = Math.max(2, currentWord.length);
            const chirpDur = Math.min(0.35, (charCount * 0.04) + 0.05);

            // Melodic sentence-level contours based on punctuation
            const isQuestion = currentWord.includes('?');
            const hasPunctuation = currentWord.match(/[,.!?]/);
            let melodyOffset = Math.sin(wordIndex * 0.8) * 12;
            
            if (isQuestion) {
              melodyOffset += 30; // pitch raises up on questions
            } else if (hasPunctuation) {
              melodyOffset -= 15; // final tone drops at period
            }

            const currentFreq = basePitch + melodyOffset;

            // Oscillators simulating vocal chords
            const osc = ctx.createOscillator();
            osc.type = oscType;
            osc.frequency.setValueAtTime(currentFreq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(currentFreq * 0.9, ctx.currentTime + chirpDur);

            // Shave off static high buzz
            const lowpass = ctx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.setValueAtTime(1400, ctx.currentTime);

            // Formant bandpass filters shaping human vowels
            const formant = ctx.createBiquadFilter();
            formant.type = 'bandpass';
            formant.Q.setValueAtTime(10, ctx.currentTime);

            // Morph mouth vowel resonance based on character makeup
            let activeFormant = formantBase;
            const lowercaseW = currentWord.toLowerCase();
            if (lowercaseW.includes('a')) {
              activeFormant = [730, 1090];
            } else if (lowercaseW.includes('e')) {
              activeFormant = [530, 1840];
            } else if (lowercaseW.includes('i')) {
              activeFormant = [270, 2290];
            } else if (lowercaseW.includes('o')) {
              activeFormant = [570, 840];
            } else if (lowercaseW.includes('u')) {
              activeFormant = [300, 870];
            }
            formant.frequency.setValueAtTime(activeFormant[0], ctx.currentTime);

            // Gain node tracking envelopes
            const ampEnvelope = ctx.createGain();
            ampEnvelope.gain.setValueAtTime(0, ctx.currentTime);
            ampEnvelope.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.02);
            ampEnvelope.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + chirpDur);

            osc.connect(lowpass);
            lowpass.connect(formant);
            formant.connect(ampEnvelope);
            ampEnvelope.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + chirpDur + 0.02);

            activeNodes.push({ osc, gain: ampEnvelope });
          } catch (oscErr) {
            console.warn('Syllable gen check fail:', oscErr);
          }

          wordIndex++;

          // Punctuation pacing delay logic
          let totalDelay = speedMs;
          if (currentWord.match(/[.!?]/)) {
            totalDelay = speedMs * 2.2;
          } else if (currentWord.match(/[,;]/)) {
            totalDelay = speedMs * 1.5;
          }

          const id = window.setTimeout(speakNextWord, totalDelay);
          timeouts.push(id);
        } else {
          // Speak rotation chain progress finished safely
          const timer = window.setTimeout(() => {
            safeCloseVoiceContext();
            onComplete();
          }, 400);
          timeouts.push(timer);
        }
      };

      speakNextWord();

      return () => {
        isCancelled = true;
        timeouts.forEach(tId => clearTimeout(tId));
        activeNodes.forEach(node => {
          try {
            node.osc.disconnect();
            node.gain.disconnect();
          } catch (_) {}
        });
        safeCloseVoiceContext();
      };

    } catch (e) {
      console.warn('Vocal formant synthesis fallback error:', e);
      setCurrentSpeechText(text);
      const wordsCount = text.split(/\s+/).length;
      const timer = window.setTimeout(onComplete, Math.max(2500, wordsCount * 250));
      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }
  };

  // Release microphone and audio handles on change
  useEffect(() => {
    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
      if (activeAudioElement) {
        try {
          activeAudioElement.pause();
        } catch (_) {}
      }
      if (noiseStopFn) {
        try {
          noiseStopFn();
        } catch (_) {}
      }
    };
  }, [selectedChainId]);

  // Master Playback Hook
  useEffect(() => {
    let audioObj: HTMLAudioElement | null = null;
    let activeSpeakCancel: (() => void) | null = null;
    let cancelled = false;

    if (chainPlaying && activeChain) {
      if (playbackMsgIdx === -1) {
        setPlaybackMsgIdx(0);
        return;
      }

      if (playbackMsgIdx < activeChain.messages.length) {
        const currentMsg = activeChain.messages[playbackMsgIdx];
        setPlayingMessageId(currentMsg.id);
        
        // Tap retro deck startup chime
        playRetroMessageNodeSound(currentMsg.senderId);

        // Filter out simulated dummy media files immediately to avoid broken browser requests and red warning logs
        const isBlobOrRealUrl = !!(
          currentMsg.audioUrl &&
          (currentMsg.audioUrl.startsWith('blob:') ||
           currentMsg.audioUrl.startsWith('data:') ||
           currentMsg.audioUrl.startsWith('http://') ||
           currentMsg.audioUrl.startsWith('https://') ||
           currentMsg.audioUrl.startsWith('/')) &&
          !currentMsg.audioUrl.includes('simulated_')
        );

        if (isBlobOrRealUrl && currentMsg.audioUrl) {
          // Pause any ongoing synthesis/speech
          try {
            window.speechSynthesis.cancel();
          } catch (_) {}

          if (activeAudioElement) {
            try {
              activeAudioElement.pause();
            } catch (_) {}
          }

          setCurrentSpeechText(currentMsg.transcript || "🔊 Playback of genuine voice recording...");

          audioObj = new Audio(currentMsg.audioUrl);
          setActiveAudioElement(audioObj);
          
          audioObj.play().catch(err => {
            if (cancelled) return;
            // Expected if user hasn't interacted with document directly or browser blocks autoplay
            activeSpeakCancel = speakMessageText(currentMsg, () => {
              if (!cancelled) setPlaybackMsgIdx(prev => prev + 1);
            });
          });

          audioObj.onended = () => {
            if (!cancelled) setPlaybackMsgIdx(prev => prev + 1);
          };

          audioObj.onerror = () => {
            if (cancelled) return;
            activeSpeakCancel = speakMessageText(currentMsg, () => {
              if (!cancelled) setPlaybackMsgIdx(prev => prev + 1);
            });
          };
        } else {
          // Speak synthesis with retro filter
          activeSpeakCancel = speakMessageText(currentMsg, () => {
            if (!cancelled) setPlaybackMsgIdx(prev => prev + 1);
          });
        }
      } else {
        stopChainPlayback();
      }
    } else {
      setPlayingMessageId(null);
      setCurrentSpeechText('');
      if (activeAudioElement) {
        try {
          activeAudioElement.pause();
        } catch (_) {}
      }
    }

    return () => {
      cancelled = true;
      if (activeSpeakCancel) {
        try {
          activeSpeakCancel();
        } catch (_) {}
      }
      if (audioObj) {
        try {
          audioObj.onended = null;
          audioObj.onerror = null;
          audioObj.pause();
          audioObj.src = '';
          audioObj.load();
        } catch (_) {}
      }
    };
  }, [chainPlaying, playbackMsgIdx, selectedChainId, activeChain]);

  // Play an individual voice note with interactive user click unblocking
  const playSingleMessageInline = (msg: VoiceChainMessage) => {
    try {
      window.speechSynthesis.cancel();
      const unlockUtterance = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(unlockUtterance);
    } catch (_) {}

    playRetroMessageNodeSound(msg.senderId);
    setPlayingMessageId(msg.id);

    const isBlobOrRealUrl = !!(
      msg.audioUrl &&
      (msg.audioUrl.startsWith('blob:') ||
       msg.audioUrl.startsWith('data:') ||
       msg.audioUrl.startsWith('http://') ||
       msg.audioUrl.startsWith('https://') ||
       msg.audioUrl.startsWith('/')) &&
      !msg.audioUrl.includes('simulated_')
    );

    if (isBlobOrRealUrl && msg.audioUrl) {
      if (activeAudioElement) {
        try { activeAudioElement.pause(); } catch (_) {}
      }
      const audioObj = new Audio(msg.audioUrl);
      setActiveAudioElement(audioObj);
      audioObj.play().catch(() => {
        speakMessageText(msg, () => {
          setPlayingMessageId(null);
        });
      });
      audioObj.onended = () => {
        setPlayingMessageId(null);
      };
      audioObj.onerror = () => {
        speakMessageText(msg, () => {
          setPlayingMessageId(null);
        });
      };
    } else {
      speakMessageText(msg, () => {
        setPlayingMessageId(null);
      });
    }
  };

  const startChainPlayback = () => {
    if (!activeChain || activeChain.messages.length === 0) return;
    
    // Synchronously unlock and clear the speech synthesis queue on user interaction
    try {
      window.speechSynthesis.cancel();
      const unlockUtterance = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(unlockUtterance);
    } catch (_) {}

    // Start warm cassette click and tape hiss
    const stopHiss = playCassetteTapeHiss();
    if (stopHiss) {
      setNoiseStopFn(() => stopHiss);
    }

    setPlaybackMsgIdx(0);
    setChainPlaying(true);
  };

  const stopChainPlayback = () => {
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}
    if (activeAudioElement) {
      try {
        activeAudioElement.pause();
      } catch (_) {}
    }
    if (noiseStopFn) {
      try {
        noiseStopFn();
      } catch (_) {}
      setNoiseStopFn(null);
    }
    setChainPlaying(false);
    setPlaybackMsgIdx(-1);
    setPlayingMessageId(null);
    setCurrentSpeechText('');
  };

  // Micro recording procedures
  const startRecordingVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: 'audio/webm' });
        const objectUrl = URL.createObjectURL(finalBlob);
        setDraftAudioUrl(objectUrl);
        
        // Stop all track streams so microphone light closes
        stream.getTracks().forEach(track => track.stop());
      };

      setRecordedChunks([]);
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setUploadError(null);
    } catch (err) {
      console.warn('Microphone permission blocked:', err);
      setUploadError('Unable to open microphone. Use the manual Audio File Upload button below instead!');
    }
  };

  const stopRecordingAndKeep = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
  };

  // Upload custom physical sound clip
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setUploadError('Highly request sound formats only (MP3, WAV, M4A or WEBM).');
      return;
    }

    setUploadError(null);
    setUploadedAudioFile(file);
    const audioUrl = URL.createObjectURL(file);
    setUploadedAudioUrl(audioUrl);
  };

  const handleCreateChain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || selectedPartners.length === 0) return;

    const chain: VoiceChain = {
      id: `vc_${Date.now()}`,
      title: newTitle,
      participants: [activeMemberId, ...selectedPartners],
      messages: [
        {
          id: `vm_${Date.now()}`,
          senderId: activeMemberId,
          duration: 45, // Introductory message
          timestamp: new Date().toISOString()
        }
      ],
      updatedAt: new Date().toISOString(),
      unreadBy: selectedPartners
    };

    onAddChain(chain);
    setShowCreateModal(false);
    setNewTitle('');
    setSelectedPartners([]);
    setSelectedChainId(chain.id);
  };

  const togglePartnerSelection = (id: string) => {
    if (selectedPartners.includes(id)) {
      setSelectedPartners(selectedPartners.filter(p => p !== id));
    } else {
      setSelectedPartners([...selectedPartners, id]);
    }
  };

  const finishRecordingReply = () => {
    if (!selectedChainId) return;
    
    // Stop recorder if active
    if (isRecording) {
      stopRecordingAndKeep();
    }

    const duration = recordingSeconds || 15;
    const finalUrl = draftAudioUrl || uploadedAudioUrl || undefined;
    
    // If no draft is captured yet but the stop call was just triggered:
    // We pass down to state once ready, or we can look up draftAudioUrl.
    onAddChainReply(selectedChainId, duration, finalUrl, draftTranscript || undefined);
    
    // Reset states
    setDraftAudioUrl(null);
    setUploadedAudioUrl(null);
    setUploadedAudioFile(null);
    setDraftTranscript('');
    setRecordingSeconds(0);
  };

  const formatRecordedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMemberName = (id: string) => {
    const m = members.find(member => member.id === id);
    return m ? m.name : 'Ancestors';
  };

  const getMemberAvatar = (id: string) => {
    const m = members.find(member => member.id === id);
    return m ? m.avatar : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80';
  };

  return (
    <div className="space-y-6" id="voice-chain-container">
      {/* Header board */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-natural-border shadow-xs">
        <div>
          <h2 className="text-2xl font-semibold serif text-[#2C2C2C] flex items-center gap-2">
            <Disc className="w-5 h-5 text-terracotta animate-spin-slow" />
            Voice Tape Chains
          </h2>
          <p className="text-xs text-natural-muted mt-0.5 animate-fade-in">Async talking letters. Recorders compile chronologically, traveling across global intervals without call pressures.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 bg-sage text-white font-bold uppercase tracking-wider text-[11px] py-2.5 px-4 rounded-xl hover:bg-sage/95 transition-all shadow-2xs cursor-pointer"
          id="create-chain-trigger"
        >
          <Plus className="w-4 h-4" /> Start Async Chain
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="chains-split-grid">
        {/* Left Side: Active Tapes Lists */}
        <div className="lg:col-span-1 space-y-3" id="chains-sidebar">
          <span className="text-[10px] font-bold tracking-wider text-natural-muted uppercase">Your Tape Archive</span>
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {chains.map(chain => {
              const isSelected = selectedChainId === chain.id;
              const hasUnread = chain.unreadBy.includes(activeMemberId);
              const lastMessage = chain.messages[chain.messages.length - 1];

              return (
                <button
                  key={chain.id}
                  onClick={() => { setSelectedChainId(chain.id); stopChainPlayback(); }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer transform hover:scale-102 ${
                    isSelected 
                      ? 'bg-gradient-to-tr from-[#FFF1F2] to-[#FFF5F5] border-[#EC4899] shadow-md ring-1 ring-[#EC4899]/30' 
                      : 'bg-white border-natural-border hover:bg-natural-light/60'
                  }`}
                  id={`chain-box-${chain.id}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-[#2C2C2C] text-sm truncate flex items-center gap-1.5">
                      <span className="text-base">📼</span> {chain.title}
                    </h4>
                    {hasUnread && (
                      <span className="bg-[#EC4899] text-white font-bold text-[8px] px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse shadow-xs">
                        🔴 NEW LOOP
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2.5">
                    {/* Avatars circle stack */}
                    <div className="flex -space-x-1.5 shrink-0 select-none">
                      {chain.participants.slice(0, 4).map(pId => (
                        <img
                          key={pId}
                          src={getMemberAvatar(pId)}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover border border-white"
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-natural-muted font-medium font-sans truncate">
                      {chain.participants.length} folks in chain
                    </span>
                  </div>

                  {lastMessage && (
                    <div className="mt-3 pt-2.5 border-t border-natural-border flex items-center justify-between text-[11px] text-[#2C2C2C]/70 font-mono">
                      <span className="truncate">Last addition by {getMemberName(lastMessage.senderId)}</span>
                      <span className="shrink-0 font-mono text-[9px]">{lastMessage.duration}s tape</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Playback & Reply cassette table */}
        <div className="lg:col-span-2 bg-[#FAF8F5] p-6 rounded-3xl border border-natural-border flex flex-col justify-between min-h-[450px]" id="chain-tape-deck">
          {activeChain ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between" id="tape-deck-panel">
              <div className="space-y-5">
                {/* Deck header controller */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-natural-border pb-4">
                  <div>
                    <h3 className="text-base font-bold text-natural-text serif">{activeChain.title}</h3>
                    <p className="text-[11px] text-natural-muted mt-0.5">Chronologically compiled async messages (No instant receipts mode)</p>
                  </div>

                  <div className="flex gap-2">
                    {chainPlaying ? (
                      <button
                        onClick={stopChainPlayback}
                        className="bg-[#2C2C2C] hover:bg-[#2C2C2C]/90 text-white text-xs font-bold uppercase tracking-wider px-4.5 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        <Pause className="w-3.5 h-3.5" /> Stop play-through
                      </button>
                    ) : (
                      <button
                        onClick={startChainPlayback}
                        className="bg-gold hover:bg-gold/95 text-white text-xs font-bold uppercase tracking-wider px-4.5 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" /> Play Combined Chain ({activeChain.messages.length} replies)
                      </button>
                    )}
                  </div>
                </div>

                {/* Simulated Analog Cassette Tape graphics */}
                <div className="bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#3B82F6] p-4.5 rounded-3xl border-4 border-slate-900 relative flex flex-col items-center justify-center text-white font-mono shadow-xl overflow-hidden max-w-sm mx-auto transform hover:rotate-1 hover:scale-102 transition-all duration-300" id="analog-cassette">
                  {/* Cassette face glossy overlay */}
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 skew-y-6 pointer-events-none"></div>
                  
                  {/* Cassette label sticker */}
                  <div className="bg-[#FEF08A] text-slate-900 px-5 py-2 text-[10px] font-bold rounded-lg uppercase tracking-wider select-none shadow-xs border border-yellow-300/60 text-center">
                    📼 Kin Radio Loop · High Fidelity
                  </div>

                  {/* Reels */}
                  <div className="flex gap-16 items-center my-4.5 relative z-10">
                    {/* Left Reels */}
                    <div className="w-14 h-14 bg-slate-950 rounded-full border-4 border-purple-500/50 flex items-center justify-center relative shadow-inner">
                      <div className={`w-10 h-10 rounded-full border-4 border-dashed border-yellow-400 absolute ${chainPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}></div>
                      <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center font-bold text-[8px] text-slate-800 z-20">L</div>
                    </div>
                    
                    {/* Center tape window containing nice reels tape coils preview */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-sans bg-black/60 px-2 py-0.5 rounded-md text-[8px] text-pink-300 select-none tracking-widest uppercase">
                      C-90
                    </div>

                    {/* Right Reels */}
                    <div className="w-14 h-14 bg-slate-950 rounded-full border-4 border-purple-500/50 flex items-center justify-center relative shadow-inner">
                      <div className={`w-10 h-10 rounded-full border-4 border-dashed border-yellow-400 absolute ${chainPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}></div>
                      <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center font-bold text-[8px] text-slate-800 z-20">R</div>
                    </div>
                  </div>

                  <span className="text-[10px] text-white/95 bg-black/35 px-3 py-1 rounded-full font-bold select-none shadow-3xs">
                    {chainPlaying ? '✨ Playhead Reading: SPINNING! 🔊' : '💤 Standby Tape'}
                  </span>
                </div>

                {/* Real-time speech subtitle transcription */}
                {chainPlaying && currentSpeechText && (
                  <div className="bg-[#FFFBFB] border border-rose-200/60 p-4 rounded-2xl max-w-sm mx-auto shadow-sm text-center animate-fade-in text-slate-700" id="retro-live-subtitle">
                    <p className="text-[10px] uppercase tracking-wider text-[#EC4899] font-extrabold mb-1 select-none flex items-center justify-center gap-1.5 font-mono">
                      <span>📻</span> LIVE TAPE TRANSCRIPTION <span>📻</span>
                    </p>
                    <p className="font-serif italic text-xs leading-relaxed text-[#1E293B] font-medium">
                      "{currentSpeechText}"
                    </p>
                  </div>
                )}

                {/* Message logs list */}
                <div className="space-y-4 max-h-60 overflow-y-auto pr-1 text-left" id="chain-replies-cascade">
                  {activeChain.messages.map((msg, index) => {
                    const isPlayingNow = playingMessageId === msg.id;
                    const dateFormatted = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div
                        key={msg.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                          isPlayingNow 
                            ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-100 shadow-xs' 
                            : 'bg-slate-50/50 border-slate-100'
                        }`}
                        id={`chain-bubble-msg-${msg.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <img src={getMemberAvatar(msg.senderId)} alt="" className="w-8 h-8 rounded-full object-cover border" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800 text-xs">{getMemberName(msg.senderId)}</span>
                              <span className="text-[10px] text-slate-400">{dateFormatted}</span>
                            </div>
                            <p className="text-slate-600 text-xs">
                              {isPlayingNow ? '🔊 Listening to response...' : '⏱️ Tape recording length:'} <strong>{msg.duration} seconds</strong>
                            </p>
                          </div>
                        </div>

                        {/* Speaker level wave mini indicator or Manual Listen button */}
                        {isPlayingNow ? (
                          <div className="flex gap-0.5 items-end h-5 shrink-0 select-none">
                            {[1, 2, 3, 4, 3, 2, 1].map((h, i) => (
                              <span
                                key={i}
                                className="w-0.5 bg-rose-500 rounded-xs animate-bounce"
                                style={{
                                  height: `${h * 20}%`,
                                  animationDelay: `${i * 0.15}s`
                                }}
                              ></span>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => playSingleMessageInline(msg)}
                            className="shrink-0 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all active:scale-95 shadow-2xs cursor-pointer"
                            title="Play this message directly with audio fallback"
                          >
                            <span>▶️</span> Listen
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rich Real-Voice Recording & File Upload Controller */}
              <div className="pt-6 border-t border-slate-100 space-y-4" id="chain-interactive-replier">
                <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-3">
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wide text-indigo-950 flex items-center gap-1">
                        <span>🎙️</span> Kin Voice Recorder Deck
                      </h4>
                      <p className="text-[11px] text-natural-muted">Upload real voice files or capture warm vocals directly</p>
                    </div>
                    
                    {/* Retro Cassette Filter Switch */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={enableWarmHiss} 
                        onChange={(e) => setEnableWarmHiss(e.target.checked)}
                        className="rounded text-rose-500 focus:ring-rose-400 w-3.5 h-3.5"
                      />
                      <span className="text-[10px] uppercase font-bold text-slate-600 font-mono tracking-wider flex items-center gap-1">
                        📻 Magnet Tape Crackle
                      </span>
                    </label>
                  </div>

                  {uploadError && (
                    <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl text-xs font-medium">
                      ⚠️ {uploadError}
                    </div>
                  )}

                  {/* Active Recording State Screen */}
                  {isRecording ? (
                    <div className="bg-rose-50 border border-rose-200/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg animate-ping absolute"></div>
                        <div className="w-10 h-10 bg-rose-600 text-white rounded-full flex items-center justify-center relative z-10">
                          <Mic className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-extrabold text-rose-950 block text-[11px] uppercase tracking-wider">Taping Live Vocals...</span>
                          <p className="text-slate-700 font-mono text-lg font-bold mt-0.5">{formatRecordedTime(recordingSeconds)}</p>
                        </div>
                      </div>

                      {/* Microphone real response indicator bars */}
                      <div className="flex gap-0.5 items-end h-8">
                        {[4, 1, 6, 2, 8, 3, 5, 2].map((val, i) => (
                          <span 
                            key={i} 
                            className="w-1 bg-rose-400 rounded-xs animate-bounce" 
                            style={{ height: `${val * 10}%`, animationDelay: `${i * 0.12}s` }}
                          ></span>
                        ))}
                      </div>

                      <button
                        onClick={stopRecordingAndKeep}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-4.5 py-2 rounded-xl transition cursor-pointer"
                      >
                        ⏹️ Stop & Save Draft
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left side: Record / Upload actions */}
                      <div className="space-y-3">
                        <span className="text-[9px] uppercase tracking-widest text-[#EC4899] font-black block">Step 1: Save real family voice</span>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                          {/* Microphone recorder trigger */}
                          <button
                            onClick={() => { startRecordingVoice(); stopChainPlayback(); }}
                            className="flex-1 bg-slate-950 hover:bg-slate-850 text-white text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                          >
                            <Mic className="w-4 h-4 text-rose-400" /> Start Real Mic Recording
                          </button>

                          {/* Manual File Upload Selector */}
                          <label className="flex-1 bg-white border-2 border-dashed border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 text-center">
                            <span>📂 Upload Real Sound File</span>
                            <input 
                              type="file" 
                              accept="audio/*" 
                              onChange={handleAudioFileUpload}
                              className="hidden" 
                            />
                          </label>
                        </div>

                        {uploadedAudioFile && (
                          <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-950">
                            <span className="truncate max-w-xs font-medium">📎 {uploadedAudioFile.name} (Ready)</span>
                            <button 
                              onClick={() => { setUploadedAudioUrl(null); setUploadedAudioFile(null); }}
                              className="text-indigo-600 hover:text-indigo-800 font-extrabold uppercase text-[10px]"
                            >
                              ✕ Remove
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right side: Customizable Transcriptions & Subtitles for the tape */}
                      <div className="space-y-3">
                        <span className="text-[9px] uppercase tracking-widest text-[#EC4899] font-black block">Step 2: Add Subtitle Caption</span>
                        <textarea
                          value={draftTranscript}
                          onChange={(e) => setDraftTranscript(e.target.value)}
                          placeholder="✍️ Type out what you say so relatives can read alongside the tape subtitles (e.g. 'Hey everyone, Mateo check-in!...' )"
                          className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-rose-500 placeholder-slate-400 leading-normal"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}

                  {/* Draft Preview & Lock block */}
                  {(draftAudioUrl || uploadedAudioUrl) && (
                    <div className="bg-gradient-to-tr from-slate-900 to-slate-800 p-4.5 rounded-2xl border border-slate-950 text-white space-y-3 shadow-md animate-fade-in">
                      <div className="flex justify-between items-center flex-wrap gap-2 text-xs">
                        <span className="font-bold flex items-center gap-1.5 font-mono text-rose-400">
                          <span>📻</span> DRAFT REPLAY PREVIEW (REAL VOICE ACTIVE)
                        </span>
                        <div className="flex gap-2.5">
                          <button
                            onClick={() => { 
                              setDraftAudioUrl(null); 
                              setUploadedAudioUrl(null); 
                              setUploadedAudioFile(null); 
                            }}
                            className="text-red-400 hover:text-red-300 font-bold uppercase text-[10px] cursor-pointer"
                          >
                            🗑️ Discard Draft
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center font-bold text-lg text-white">
                            ▶️
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block font-mono">Real-vocal track compilation loaded</span>
                            <audio 
                              src={draftAudioUrl || uploadedAudioUrl || undefined} 
                              controls 
                              className="h-8 max-w-full scale-90 origin-left opacity-90 mt-1"
                            />
                          </div>
                        </div>

                        <button
                          onClick={finishRecordingReply}
                          className="w-full md:w-auto bg-[#EC4899] hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-wider py-3 px-5 rounded-xl cursor-pointer shadow-md transition-all shrink-0 flex items-center justify-center gap-1"
                        >
                          🔒 Lock Track & Pass to Family
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-natural-light/20 rounded-2xl border border-slate-200/50 text-[11px] text-slate-500 leading-normal text-center">
                  💡 <strong>Real Voice Mode Active:</strong> Clicking "Start Real Mic Recording" or uploading a voice clip plays back your exact tone and authentic family speech during chain playback. <em>No more default robotic speech synthesis!</em>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-center h-full space-y-3">
              <Disc className="w-12 h-12 text-slate-300 animate-spin-slow" />
              <p className="text-slate-600 font-medium text-sm">Select an active check-in tape on the left window to play conversation replies.</p>
            </div>
          )}
        </div>
      </div>

      {/* START NEW CHAIN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-40" id="create-chain-modal">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-xl animate-scale-up space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Start a Patient Voice Chain</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateChain} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Chain Loop Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Grandma's Garden Updates 🌿"
                  className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Select Family Members in Chain</label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {members.filter(m => m.id !== activeMemberId).map(member => {
                    const selected = selectedPartners.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => togglePartnerSelection(member.id)}
                        className={`p-2.5 rounded-xl border text-xs text-left font-bold cursor-pointer transition-all flex items-center gap-2.5 ${
                          selected 
                            ? 'bg-rose-50 border-rose-400 text-rose-800' 
                            : 'bg-white border-slate-100 text-slate-600'
                        }`}
                      >
                        <img src={member.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                        <span>{member.name} ({member.relation})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-xs text-slate-600 leading-relaxed">
                🚀 Starting this chain loops 1 default <strong>45s starter audio tape check-in</strong> by you, letting others reply async whenever their schedule clears.
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedPartners.length === 0}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-xs ${
                    selectedPartners.length === 0 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-rose-600 text-white hover:bg-rose-700'
                  }`}
                >
                  Create & Tape intro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
