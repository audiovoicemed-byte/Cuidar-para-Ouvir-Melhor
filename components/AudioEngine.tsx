
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
  // 1. Verificações de segurança
  if (!audioCtxRef.current || !voiceBuffer || !voiceGainNodeRef.current) return;
  
  // 2. IMPORTANTE: Para a voz anterior imediatamente
  // Sem isso, o navegador pode se recusar a tocar dois buffers iguais ao mesmo tempo
  try {
    voiceNodeRef.current?.disconnect(); // Desconecta o cabo
    voiceNodeRef.current?.stop();       // Para o motor
  } catch (e) {
    // Ignora se não houver nada tocando
  }

  const ctx = audioCtxRef.current;
  const voiceSource = ctx.createBufferSource();
  voiceSource.buffer = voiceBuffer;
  voiceSource.loop = false; 
  voiceSource.connect(voiceGainNodeRef.current);
  
  voiceSource.onended = () => {
    if (onEnded) onEnded();
  };

  // 3. Salva a nova referência para podermos pará-la no próximo clique
  voiceNodeRef.current = voiceSource;
  voiceSource.start(0);
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

    // CALIBRAÇÃO 60dBNA: Ajustamos os ganhos para níveis conservadores (escala 0.0 a 1.0)
    // 0.4 a 0.5 de ganho em ruído branco/tons puros em fones comuns costuma aproximar-se de níveis de conversa (60dB).
    
    // 1. Ganho do Zumbido (LIMITADO)
    const tinnitusGain = ctx.createGain();
    let tinnitusVolume = 0.40; // Teto de 60dBNA aproximado
    
    if (type === TinnitusType.CRICKET) {
      tinnitusVolume = 0.25;
    } else if (type === TinnitusType.TONAL) {
      tinnitusVolume = 0.30; // Tons puros agudos são percebidos como mais altos
    }
    
    tinnitusGain.gain.setValueAtTime(tinnitusVolume, ctx.currentTime);
    tinnitusGain.connect(ctx.destination);

    // 2. Ganho da Voz (LIMITADO)
    const voiceGain = ctx.createGain();
    let voiceVolume = 0.15; 
    
    if (type === TinnitusType.HISSING) {
      voiceVolume = 0.45; // Chiado mascara muito a voz, aumentamos um pouco mas respeitando o limite
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
    
    // Inicia a voz pela primeira vez
    if (voiceBuffer) {
      startVoice();
    }
  };

// 1. Controla o início e o fim da simulação (Zumbido + Voz)
  useEffect(() => {
    if (isPlaying) {
      startSimulation();
    } else {
      stopAll();
    }
    // Cleanup: Garante que o som pare se o usuário sair da página
    return () => stopAll();
  }, [isPlaying]);

  // 2. Controla especificamente o gatilho de repetir a frase
 useEffect(() => {
  if (voiceTrigger > 0 && voiceBuffer && audioCtxRef.current) {
    const ctx = audioCtxRef.current;

    // O "Despertador": Força o contexto de áudio a ficar ativo
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        startVoice();
      });
    } else {
      startVoice();
    }
  }
}, [voiceTrigger]);
      return null; // O componente gerencia o áudio nos bastidores
};
