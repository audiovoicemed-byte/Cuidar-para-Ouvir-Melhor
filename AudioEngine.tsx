
import React, { useEffect, useRef } from 'react';
import { TinnitusType } from '../types';

interface AudioEngineProps {
  type: TinnitusType;
  isPlaying: boolean;
  voiceBuffer: AudioBuffer | null;
  voiceTrigger: number; // Propriedade para disparar a repetição da voz
  onEnded?: () => void; // Callback para quando o áudio terminar
}

export const AudioEngine: React.FC<AudioEngineProps> = ({ type, isPlaying, voiceBuffer, voiceTrigger, onEnded }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const tinnitusNodeRef = useRef<OscillatorNode | AudioBufferSourceNode | null>(null);
  const voiceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const voiceGainNodeRef = useRef<GainNode | null>(null);

  const stopAll = () => {
    try {
      tinnitusNodeRef.current?.stop();
      voiceNodeRef.current?.stop();
      lfoRef.current?.stop();
    } catch (e) { }
    tinnitusNodeRef.current = null;
    voiceNodeRef.current = null;
    lfoRef.current = null;
  };

  const startVoice = () => {
    if (!audioCtxRef.current || !voiceBuffer || !voiceGainNodeRef.current) return;
    
    // Para a voz anterior se estiver tocando
    try {
      voiceNodeRef.current?.stop();
    } catch (e) {}

    const ctx = audioCtxRef.current;
    const voiceSource = ctx.createBufferSource();
    voiceSource.buffer = voiceBuffer;
    voiceSource.loop = false; 
    voiceSource.connect(voiceGainNodeRef.current);
    
    // Sincroniza o fim da experiência com o fim da voz
    voiceSource.onended = () => {
      if (onEnded) onEnded();
    };

    voiceNodeRef.current = voiceSource;
    voiceSource.start();
  };

  const startSimulation = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    stopAll();

    // CALIBRAÇÃO 60dBNA: Ajustamos os ganhos para níveis conservadores
    const tinnitusGain = ctx.createGain();
    let tinnitusVolume = 0.40;
    
    if (type === TinnitusType.CRICKET) {
      tinnitusVolume = 0.25;
    } else if (type === TinnitusType.TONAL) {
      tinnitusVolume = 0.30;
    }
    
    tinnitusGain.gain.setValueAtTime(tinnitusVolume, ctx.currentTime);
    tinnitusGain.connect(ctx.destination);

    const voiceGain = ctx.createGain();
    let voiceVolume = 0.15; 
    
    if (type === TinnitusType.HISSING) {
      voiceVolume = 0.45;
    } else if (type === TinnitusType.TONAL) {
      voiceVolume = 0.10; 
    } else if (type === TinnitusType.CRICKET) {
      voiceVolume = 0.12; 
    }
    
    voiceGain.gain.setValueAtTime(voiceVolume, ctx.currentTime);
    voiceGain.connect(ctx.destination);
    voiceGainNodeRef.current = voiceGain;

    // Setup Tinnitus Sound
    if (type === TinnitusType.TONAL) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(6000, ctx.currentTime);
      tinnitusNodeRef.current = osc;
      osc.connect(tinnitusGain);
    } else if (type === TinnitusType.HISSING) {
      const bufferSize = ctx.sampleRate * 5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      tinnitusNodeRef.current = noise;
      noise.connect(tinnitusGain);
    } else if (type === TinnitusType.PULSATILE) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      const mod = ctx.createGain();
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 1.2;
      lfo.connect(mod.gain);
      osc.connect(mod);
      mod.connect(tinnitusGain);
      lfo.start();
      lfoRef.current = lfo;
      tinnitusNodeRef.current = osc;
    } else {
      const osc = ctx.createOscillator();
      osc.type = 'sine'; 
      osc.frequency.setValueAtTime(5500, ctx.currentTime); 
      const mod = ctx.createGain();
      const lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.value = 18; 
      lfo.connect(mod.gain);
      osc.connect(mod);
      mod.connect(tinnitusGain);
      lfo.start();
      lfoRef.current = lfo;
      tinnitusNodeRef.current = osc;
    }

    tinnitusNodeRef.current.start();
    
  // Inicia a voz
    if (voiceBuffer) {
      startVoice();
    }
  };

  useEffect(() => {
    if (isPlaying) {
      startSimulation();
    } else {
      stopAll();
    }
    return () => stopAll();
  }, [isPlaying, type, voiceBuffer, voiceTrigger]); // Reinicia tudo quando qualquer um destes mudar

  return null;
};
