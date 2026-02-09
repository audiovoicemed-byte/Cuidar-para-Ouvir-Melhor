import React, { useState, useEffect } from 'react';
import { TinnitusType } from './types';
import { 
  generatePersonalizedAdvice 
} from './services/geminiService';
import { AudioEngine } from './components/AudioEngine';

enum Step {
  INTRO,
  SELECT_TYPE,
  LISTENING,
  FEEDBACK,
  SUMMARY
}

const FEELINGS = [
  { icon: '😫', label: 'Irritado', color: 'bg-red-50 text-red-700 border-red-100 hover:border-red-300' },
  { icon: '😰', label: 'Ansioso', color: 'bg-orange-50 text-orange-700 border-orange-100 hover:border-orange-300' },
  { icon: '😔', label: 'Incomodado', color: 'bg-teal-50 text-[#005f60] border-teal-100 hover:border-teal-300' },
  { icon: '🥱', label: 'Cansado', color: 'bg-gray-50 text-gray-700 border-gray-100 hover:border-gray-300' },
  { icon: '😌', label: 'Tranquilo', color: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:border-emerald-300' },
  { icon: '🧐', label: 'Curioso', color: 'bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-300' },
];

const LogoGE = () => (
  <div className="flex items-center gap-4 md:gap-5">
    <div className="flex-shrink-0">
      <img 
        src="/logo-ge.svg" 
        alt="GE Vernova" 
        className="h-6 md:h-8 w-auto object-contain"
      />
    </div>
    <div className="flex flex-col border-l-2 border-slate-200 pl-4 py-0.5">
      <span className="text-[10px] md:text-[11px] font-black text-[#005f60] uppercase tracking-[0.15em] leading-none">Cuidar para</span>
      <span className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-none mt-1">Ouvir Melhor</span>
    </div>
  </div>
);

// ... (Componentes PCABadge e HearingVisual permanecem iguais ao seu código)

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>(Step.INTRO);
  const [selectedType, setSelectedType] = useState<TinnitusType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStartedOnce, setHasStartedOnce] = useState(false);
  const [voiceTrigger, setVoiceTrigger] = useState(0);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [phrase, setPhrase] = useState<string>('');
  const [voiceBuffer, setVoiceBuffer] = useState<AudioBuffer | null>(null);
  const [advice, setAdvice] = useState<string>('');
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [listenTimer, setListenTimer] = useState(0);

  useEffect(() => {
    let interval: number;
    if (isPlaying && currentStep === Step.LISTENING) {
      interval = window.setInterval(() => {
        setListenTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep]);

  const selectTinnitus = async (type: TinnitusType) => {
    setIsLoadingChallenge(true);
    setSelectedType(type);

    const audioMap: Record<TinnitusType, string> = {
      [TinnitusType.TONAL]: '/voz-tonal.mp3',
      [TinnitusType.HISSING]: '/voz-chiado.mp3',
      [TinnitusType.PULSATILE]: '/voz-pulsatil.mp3',
      [TinnitusType.CRICKET]: '/voz-grilo.mp3',
    };

    const frasesFixas: Record<TinnitusType, string> = {
      [TinnitusType.TONAL]: "A exposição a ruídos intensos sem proteção pode causar danos irreversíveis.",
      [TinnitusType.HISSING]: "O uso correto dos protetores auditivos é a sua principal defesa no trabalho.",
      [TinnitusType.PULSATILE]: "Zumbido pulsátil deve ser avaliado por um especialista. Proteja seus ouvidos.",
      [TinnitusType.CRICKET]: "Sons intermitentes também indicam fadiga auditiva. Faça pausas de silêncio.",
    };

    try {
      setPhrase(frasesFixas[type]);
      
      const response = await fetch(audioMap[type]);
      if (!response.ok) throw new Error("Áudio não encontrado na pasta public");
      
      const arrayBuffer = await response.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await audioCtx.decodeAudioData(arrayBuffer);

      setVoiceBuffer(buffer);
      setCurrentStep(Step.LISTENING);
      setIsPlaying(false);
      setHasStartedOnce(false);
      setListenTimer(0);
      setVoiceTrigger(0);
    } catch (e) {
      console.error("Erro ao carregar áudio:", e);
      alert("Certifique-se de que os arquivos MP3 estão na pasta public.");
    } finally {
      setIsLoadingChallenge(false);
    }
  };

  const startAudio = () => {
    setListenTimer(0);
    setIsPlaying(true);
    setHasStartedOnce(true);
  };

  const repeatVoice = () => {
    setListenTimer(0);
    setVoiceTrigger(prev => prev + 1);
    setIsPlaying(true);
  };

  const stopListening = () => {
    setIsPlaying(false);
    setCurrentStep(Step.FEEDBACK);
  };

  const handleFeelingSubmit = async (feeling: string) => {
    setSelectedFeeling(feeling);
    setCurrentStep(Step.SUMMARY);
    setIsLoadingAdvice(true);
    try {
      // O conselho ainda pode ser gerado pela IA, pois é apenas texto (consome pouca cota)
      const result = await generatePersonalizedAdvice(selectedType!, feeling);
      setAdvice(result);
    } catch (e) {
      setAdvice("Proteja sua audição hoje para garantir o seu silêncio amanhã.");
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  // ... (Restante das funções resetToMenu, resetAll e o return JSX permanecem iguais)
}
