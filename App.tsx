import React, { useState, useEffect } from 'react';
import { TinnitusType, Step } from './types';
import { 
  generatePersonalizedAdvice, 
  generateInformativePhrase 
} from './services/geminiService';
import { AudioEngine } from './components/AudioEngine';

// --- COMPONENTES AUXILIARES ---
const FEELINGS = [
  { icon: '😟', label: 'Incomodado', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { icon: '🤯', label: 'Irritado', color: 'bg-red-50 text-red-700 border-red-200' },
  { icon: '🔇', label: 'Isolado', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  { icon: '⚠️', label: 'Inseguro', color: 'bg-orange-50 text-orange-700 border-orange-200' },
];

const LogoGE = () => (
  <div className="flex items-center gap-4 md:gap-5">
    <div className="flex-shrink-0">
      <img src="/logo-ge.svg" alt="GE Vernova" className="h-6 md:h-8 w-auto object-contain" />
    </div>
    <div className="flex flex-col border-l-2 border-slate-200 pl-4 py-0.5">
      <span className="text-[10px] font-black text-slate-900 tracking-[0.2em] leading-tight">GE VERNOVA</span>
      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Saúde Ocupacional</span>
    </div>
  </div>
);

const PCABadge = () => (
  <div className="flex flex-col items-center justify-center bg-[#005f60] px-4 md:px-6 py-2 rounded-2xl border border-white/10 shadow-lg min-w-[140px]">
    <span className="text-xs md:text-sm font-black text-white uppercase tracking-[0.3em]">PCA</span>
    <span className="text-[7px] md:text-[8px] font-black text-teal-100/80 uppercase tracking-[0.15em] whitespace-nowrap">Programa de Conservação Auditiva</span>
  </div>
);

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>(Step.INTRO);
  const [selectedType, setSelectedType] = useState<TinnitusType | null>(null);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [advice, setAdvice] = useState('');
  const [voiceBuffer, setVoiceBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStartedOnce, setHasStartedOnce] = useState(false);
  const [listenTimer, setListenTimer] = useState(0);
  const [voiceTrigger, setVoiceTrigger] = useState(0);

  // Lógica para selecionar o zumbido e carregar áudio MP3
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
      if (!response.ok) throw new Error("Áudio não encontrado");
      
      const arrayBuffer = await response.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await audioCtx.decodeAudioData(arrayBuffer);
      
      setVoiceBuffer(buffer);
      setCurrentStep(Step.LISTENING);
    } catch (e) {
      console.error("Erro ao carregar áudio:", e);
      alert("Certifique-se de que os arquivos MP3 estão na pasta public.");
    } finally {
      setIsLoadingChallenge(false);
    }
  };

  const startAudio = () => {
    setIsPlaying(true);
    setHasStartedOnce(true);
  };

  const repeatVoice = () => {
    setVoiceTrigger(prev => prev + 1);
    setIsPlaying(true);
  };

  const handleFeelingSubmit = async (feeling: string) => {
    setSelectedFeeling(feeling);
    setCurrentStep(Step.SUMMARY);
    setIsLoadingAdvice(true);
    try {
      const result = await generatePersonalizedAdvice(selectedType!, feeling);
      setAdvice(result);
    } catch (e) {
      setAdvice("Não ignore os sinais do seu corpo. Procure o ambulatório médico da GE.");
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const resetAll = () => {
    setCurrentStep(Step.INTRO);
    setSelectedType(null);
    setVoiceBuffer(null);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-2xl flex items-center justify-between mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <LogoGE />
        <PCABadge />
      </header>

      <main className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[580px]">
        <div className="p-8 md:p-12 flex-1 flex flex-col">
          {currentStep === Step.INTRO && (
            <div className="flex-1 flex flex-col items-center text-center justify-center space-y-10">
               <h2 className="text-4xl font-black text-slate-900 leading-tight">
                Proteja sua <span className="text-[#005f60]">Audição</span>.
              </h2>
              <p className="text-slate-600 text-xl font-medium italic">
                “Zumbido não é normal. É sinal de que sua audição precisa de proteção.”
              </p>
              <button 
                onClick={() => setCurrentStep(Step.SELECT_TYPE)}
                className="px-16 py-6 bg-[#005f60] text-white font-black text-xl rounded-2xl shadow-xl hover:bg-[#004d4e] transition-all"
              >
                INICIAR EXPERIÊNCIA
              </button>
            </div>
          )}

          {currentStep === Step.SELECT_TYPE && (
            <div className="flex-1 flex flex-col">
              <h3 className="text-2xl font-black mb-6 border-l-4 border-[#005f60] pl-4">Escolha um tipo de Zumbido:</h3>
              <div className="grid grid-cols-1 gap-4">
                {Object.values(TinnitusType).map((type) => (
                  <button
                    key={type}
                    onClick={() => selectTinnitus(type)}
                    className="p-6 text-left border-2 rounded-2xl hover:border-[#005f60] transition-all bg-slate-50"
                  >
                    <span className="font-black text-lg text-slate-800">{type}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === Step.LISTENING && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              <AudioEngine 
                type={selectedType!} 
                isPlaying={isPlaying} 
                voiceBuffer={voiceBuffer}
                voiceTrigger={voiceTrigger}
                onEnded={() => setIsPlaying(false)}
              />
              <p className="text-center font-bold text-slate-700">Tente ouvir a mensagem através do zumbido.</p>
              {!hasStartedOnce ? (
                <button onClick={startAudio} className="px-12 py-5 bg-[#005f60] text-white font-black rounded-xl">ATIVAR SOM</button>
              ) : (
                <div className="flex flex-col gap-3">
                  <button onClick={repeatVoice} disabled={isPlaying} className="px-12 py-4 border-2 border-[#005f60] text-[#005f60] font-black rounded-xl">REPETIR</button>
                  <button onClick={() => setCurrentStep(Step.FEEDBACK)} className="px-12 py-4 bg-slate-900 text-white font-black rounded-xl">CONCLUÍDO</button>
                </div>
              )}
            </div>
          )}

          {currentStep === Step.FEEDBACK && (
            <div className="flex-1 flex flex-col">
              <h3 className="text-2xl font-black mb-6">Como você se sentiu?</h3>
              <div className="grid grid-cols-2 gap-4">
                {FEELINGS.map((f) => (
                  <button key={f.label} onClick={() => handleFeelingSubmit(f.label)} className={`p-6 border-2 rounded-2xl flex flex-col items-center ${f.color}`}>
                    <span className="text-4xl">{f.icon}</span>
                    <span className="font-bold text-xs mt-2 uppercase">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === Step.SUMMARY && (
            <div className="flex-1 flex flex-col space-y-6">
              <div className="bg-[#005f60] text-white p-8 rounded-3xl shadow-xl">
                <p className="text-xs font-black opacity-60 uppercase mb-2">A frase era:</p>
                <p className="text-xl font-bold italic mb-6">"{phrase}"</p>
                <div className="h-px bg-white/20 mb-6" />
                <p className="text-xs font-black opacity-60 uppercase mb-2">Conselho do Especialista:</p>
                <p className="text-lg font-bold">{advice}</p>
              </div>
              <button onClick={resetAll} className="w-full py-5 bg-[#005f60] text-white font-black rounded-2xl">NOVA SIMULAÇÃO</button>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-8 text-center text-slate-400 text-[10px] font-black tracking-widest uppercase">
        © 03 DE MARÇO DE 2026 • DIA MUNDIAL DA AUDIÇÃO • GE VERNOVA
      </footer>
    </div>
  );
}
