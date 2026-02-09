
import { TinnitusType, Step } from './types'; // Apenas um ponto
import { AudioEngine } from './AudioEngine'; // Remova o '/components'
// Se o geminiService estiver na raiz também:
import { generatePersonalizedAdvice } from './geminiService';
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

constconst LogoGE = () => (
  <div className="flex items-center gap-4 md:gap-5">
    <div className="flex-shrink-0">
      {/* Alterado para .png e garantindo a barra inicial "/" */}
      <img 
        src="/logo-ge.png" 
        alt="GE Vernova" 
        className="h-8 md:h-10 w-auto object-contain" 
      />
    </div>
    <div className="flex flex-col border-l-2 border-slate-200 pl-4 py-0.5">
      <span className="text-[10px] font-black text-slate-900 tracking-[0.2em] leading-tight text-left">GE VERNOVA</span>
      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-left">Saúde Ocupacional</span>
    </div>
  </div>
);

const PCABadge = () => (
  <div className="flex flex-col items-center justify-center bg-[#005f60] px-4 md:px-6 py-2 rounded-2xl border border-white/10 shadow-[0_10px_20px_-5px_rgba(0,95,96,0.3)] relative overflow-hidden group min-w-[140px] md:min-w-[180px]">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-1.5 mb-0.5">
        <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-teal-300 rounded-full animate-pulse shadow-[0_0_8px_rgba(94,234,212,0.8)]"></div>
        <span className="text-xs md:text-sm font-black text-white uppercase tracking-[0.3em] leading-tight">PCA</span>
        <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-teal-300 rounded-full animate-pulse shadow-[0_0_8px_rgba(94,234,212,0.8)]"></div>
      </div>
      <span className="text-[7px] md:text-[8px] font-black text-teal-100/80 uppercase tracking-[0.15em] leading-tight whitespace-nowrap">
        Programa de Conservação Auditiva
      </span>
    </div>
  </div>
);

interface HearingVisualProps {
  type?: TinnitusType | null;
  active?: boolean;
  isStatic?: boolean;
}

const HearingVisual: React.FC<HearingVisualProps> = ({ type, active, isStatic }) => {
  const getTheme = () => {
    switch (type) {
      case TinnitusType.TONAL:
        return { color: '#00afb0', waveClass: 'animate-tonal' };
      case TinnitusType.HISSING:
        return { color: '#005f60', waveClass: 'animate-hissing' };
      case TinnitusType.PULSATILE:
        return { color: '#f43f5e', waveClass: 'animate-pulsatile' };
      case TinnitusType.CRICKET:
        return { color: '#10b981', waveClass: 'animate-cricket' };
      default:
        return { color: '#005f60', waveClass: 'animate-ideal' };
    }
  };

  const theme = getTheme();
  const waveClass = isStatic ? '' : theme.waveClass;

  return (
    <div className={`relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center overflow-hidden rounded-[4rem] bg-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)] border border-slate-100 transition-all duration-700 ${isStatic ? '' : 'group'}`}>
      <div className={`relative z-20 flex items-center justify-center w-full h-full p-10 md:p-14 transition-all duration-700 ${isStatic ? '' : 'group-hover:scale-110'}`}>
        <svg viewBox="0 0 512 512" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(180, 256)" className={waveClass}>
            {[50, 100, 150, 200].map((radius, i) => (
              <path 
                key={i}
                d={`M${radius - 15} -${radius} A${radius + 50} ${radius + 50} 0 0 1 ${radius - 15} ${radius}`} 
                fill="none" 
                stroke={theme.color} 
                strokeWidth={28 + i * 6} 
                strokeLinecap="round" 
                className={`wave-arc transition-colors duration-1000 ${active ? '' : 'opacity-40'}`}
                style={{ 
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </g>
          <circle 
            cx="140" 
            cy="256" 
            r="35" 
            fill={theme.color} 
            className={`transition-all duration-1000 ${active ? 'animate-pulse scale-110' : 'opacity-20'}`}
          />
        </svg>
      </div>

      <style>{`
        @keyframes tonal-wave {
          0%, 100% { transform: scaleX(1); opacity: 0.3; }
          50% { transform: scaleX(1.4); opacity: 0.9; }
        }
        .animate-tonal .wave-arc { animation: tonal-wave 0.6s ease-in-out infinite; }

        @keyframes hissing-wave {
          0% { transform: translate(0,0); opacity: 0.2; }
          25% { transform: translate(3px, -4px); opacity: 0.7; }
          50% { transform: translate(-3px, 3px); opacity: 0.3; }
          75% { transform: translate(4px, 2px); opacity: 0.8; }
          100% { transform: translate(0,0); opacity: 0.2; }
        }
        .animate-hissing .wave-arc { animation: hissing-wave 0.1s linear infinite; }

        @keyframes pulsatile-wave {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          40% { transform: scale(1.2); opacity: 1; }
          60% { transform: scale(1.1); opacity: 0.7; }
        }
        .animate-pulsatile .wave-arc { animation: pulsatile-wave 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite; }

        @keyframes cricket-wave {
          0%, 85%, 100% { opacity: 0.1; transform: scale(1); }
          90%, 95% { opacity: 1; transform: scale(1.15); }
        }
        .animate-cricket .wave-arc { animation: cricket-wave 0.4s step-end infinite; }

        @keyframes ideal-wave {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.08); opacity: 0.8; }
        }
        .animate-ideal .wave-arc { animation: ideal-wave 3.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

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
    
    // Mapeamento dos arquivos de áudio que estão na sua pasta public
    const audioMap: Record<TinnitusType, string> = {
      [TinnitusType.TONAL]: '/voz-tonal.mp3',
      [TinnitusType.HISSING]: '/voz-chiado.mp3',
      [TinnitusType.PULSATILE]: '/voz-pulsatil.mp3',
      [TinnitusType.CRICKET]: '/voz-grilo.mp3',
    };

    // Frases que aparecerão no resumo final (foco em fonoaudiologia/segurança)
    const frasesFixas: Record<TinnitusType, string> = {
      [TinnitusType.TONAL]: "A exposição a ruídos intensos sem proteção pode causar danos irreversíveis.",
      [TinnitusType.HISSING]: "O uso correto dos protetores auditivos é a sua principal defesa no trabalho.",
      [TinnitusType.PULSATILE]: "Zumbido pulsátil deve ser avaliado por um especialista. Proteja seus ouvidos.",
      [TinnitusType.CRICKET]: "Sons intermitentes também indicam fadiga auditiva. Faça pausas de silêncio.",
    };

    try {
      // 1. Define a frase educativa imediatamente
      setPhrase(frasesFixas[type]);

      // 2. Busca o arquivo MP3 correspondente
      const response = await fetch(audioMap[type]);
      if (!response.ok) throw new Error("Arquivo de áudio não encontrado na pasta public");
      
      const arrayBuffer = await response.arrayBuffer();
      
      // 3. Prepara o contexto de áudio para decodificar o MP3
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await audioCtx.decodeAudioData(arrayBuffer);
      
      // 4. Salva o áudio decodificado e avança para a etapa de audição
      setVoiceBuffer(buffer);
      setCurrentStep(Step.LISTENING);

    } catch (e) {
      console.error("Erro na triagem de áudio:", e);
      alert("Erro ao carregar a simulação. Verifique se os arquivos MP3 estão na pasta 'public'.");
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
  // Date.now() gera um número gigante que muda a cada milissegundo
  setVoiceTrigger(Date.now()); 
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
      const result = await generatePersonalizedAdvice(selectedType!, feeling);
      setAdvice(result);
    } catch (e) {
      setAdvice("Proteja sua audição hoje para garantir o seu silêncio amanhã.");
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const resetToMenu = () => {
    setSelectedType(null);
    setSelectedFeeling(null);
    setAdvice('');
    setPhrase('');
    setVoiceBuffer(null);
    setIsPlaying(false);
    setHasStartedOnce(false);
    setListenTimer(0);
    setVoiceTrigger(0);
    setCurrentStep(Step.SELECT_TYPE);
  };

  const resetAll = () => {
    setCurrentStep(Step.INTRO);
    setSelectedType(null);
    setSelectedFeeling(null);
    setAdvice('');
    setPhrase('');
    setVoiceBuffer(null);
    setIsPlaying(false);
    setHasStartedOnce(false);
    setListenTimer(0);
    setVoiceTrigger(0);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-2xl flex items-center justify-between mb-8 md:mb-10 bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-200">
        <LogoGE />
        <PCABadge />
      </header>

      <main className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl shadow-slate-300/50 border border-slate-200 overflow-hidden flex flex-col min-h-[580px] transition-all duration-500">
        <div className="h-2 w-full bg-slate-100">
          <div 
            className="h-full bg-[#005f60] transition-all duration-700 ease-in-out" 
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        <div className="p-8 md:p-12 flex-1 flex flex-col">
          {currentStep === Step.INTRO && (
            <div className="flex-1 flex flex-col items-center text-center justify-center space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <HearingVisual />
              
              <div className="space-y-6">
                <div className="inline-block px-5 py-2 bg-teal-50 text-[#005f60] rounded-full text-[10px] font-black tracking-[0.3em] uppercase border border-teal-200 shadow-sm">
                  Cuidar para Ouvir Melhor
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                  Proteja sua <span className="text-[#005f60]">Audição</span>.
                </h2>
                <p className="text-slate-600 max-w-md mx-auto leading-relaxed text-xl font-medium italic">
                  “Zumbido não é normal. É sinal de que sua audição precisa de proteção.”
                </p>
                <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
                  Experiência imersiva GE Vernova: sinta na prática como o zumbido prejudica a sua comunicação afetando a sua qualidade de vida e a sua segurança no ambiente de trabalho.
                </p>
              </div>
              
              <button 
                onClick={() => setCurrentStep(Step.SELECT_TYPE)}
                className="w-full sm:w-auto px-16 py-6 bg-[#005f60] hover:bg-[#004d4e] text-white font-black text-xl rounded-2xl transition-all shadow-xl shadow-[#005f60]/30 active:scale-95 flex items-center justify-center gap-3 group border-b-4 border-[#003d3e]"
              >
                INICIAR EXPERIÊNCIA
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}

          {currentStep === Step.SELECT_TYPE && (
            <div className="flex-1 flex flex-col animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
                <div className="border-l-8 border-[#005f60] pl-6 py-2">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Veja como o Zumbido interfere na comunicação</h3>
                  <p className="text-slate-500 text-lg">Clique nos sons abaixo e tenha uma experiência imersiva de como é viver com zumbido.</p>
                </div>
                <HearingVisual type={selectedType} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {Object.values(TinnitusType).map((type) => (
                  <button
                    key={type}
                    disabled={isLoadingChallenge}
                    onMouseEnter={() => setSelectedType(type)}
                    onMouseLeave={() => !isLoadingChallenge && setSelectedType(null)}
                    onClick={() => selectTinnitus(type)}
                    className={`p-8 text-left border-2 rounded-3xl transition-all active:scale-95 group relative overflow-hidden ${selectedType === type ? 'border-[#005f60] bg-teal-50/30' : 'border-slate-100 bg-slate-50/50'}`}
                  >
                    <div className="font-black text-xl text-slate-800 group-hover:text-[#005f60] mb-2 flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full transition-all ${selectedType === type ? 'bg-[#005f60] animate-ping' : 'bg-slate-300'}`}></div>
                      {type}
                    </div>
                    <div className="text-sm text-slate-500 leading-relaxed font-medium">
                      {type === TinnitusType.TONAL && "Apito constante de alta frequência."}
                      {type === TinnitusType.HISSING && "Chiado de vapor contínuo."}
                      {type === TinnitusType.PULSATILE && "Som rítmico cardiovascular."}
                      {type === TinnitusType.CRICKET && "Frequência intermitente irritante."}
                    </div>
                  </button>
                ))}
              </div>
              {isLoadingChallenge && (
                <div className="mt-10 flex items-center justify-center gap-4 text-[#005f60] animate-pulse bg-teal-50/80 py-6 rounded-2xl border-2 border-[#005f60]/20">
                  <div className="w-6 h-6 border-4 border-[#005f60] border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-black text-sm tracking-[0.2em] uppercase">Calibrando Frequência Imersiva...</span>
                </div>
              )}
            </div>
          )}

          {currentStep === Step.LISTENING && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-12 animate-in duration-500">
              <AudioEngine 
                type={selectedType!} 
                isPlaying={isPlaying} 
                voiceBuffer={voiceBuffer} 
                voiceTrigger={voiceTrigger} 
                onEnded={() => setIsPlaying(false)}
              />
              
              <HearingVisual type={selectedType} active={isPlaying} isStatic={true} />
              
              <div className="text-center space-y-4 px-8 min-h-[40px] flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 mb-2">
                   {isPlaying && (
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-full text-white text-[10px] font-black tracking-widest uppercase animate-in fade-in duration-300">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      EM CURSO • {listenTimer}S
                    </div>
                  )}
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Foco Total</h3>
                <p className="text-slate-600 max-w-sm mx-auto leading-relaxed font-medium">
                  {isPlaying 
                    ? "Uma frase sobre cuidados auditivos está sendo dita. Você conseguiu decifrar cada palavra?"
                    : "Coloque seus fones. Ative o som para ouvir a frase em meio ao zumbido."
                  }
                </p>
              </div>

              <div className="flex flex-col gap-4 w-full sm:w-auto items-center">
                {!hasStartedOnce ? (
                  <button 
                    onClick={startAudio}
                    className="px-16 py-6 bg-[#005f60] hover:bg-[#004d4e] text-white font-black rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 border-b-4 border-[#003d3e]"
                  >
                    <span className="text-xl">▶</span> ATIVAR ÁUDIO
                  </button>
                ) : (
                  <div className="flex flex-col gap-3 w-full animate-in fade-in duration-500">
                    <button 
                      onClick={repeatVoice}
                      disabled={isPlaying}
                      className={`px-12 py-4 bg-white border-2 border-[#005f60] text-[#005f60] hover:bg-teal-50 font-black rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-3 ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="text-2xl">{isPlaying ? '🔊' : '🔄'}</span> 
                      {isPlaying ? 'OUVINDO...' : 'REPETIR FRASE'}
                    </button>
                    <button 
                      onClick={stopListening}
                      className="px-12 py-5 bg-slate-900 hover:bg-black text-white font-black rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                    >
                      CONCLUÍDO
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === Step.FEEDBACK && (
            <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-500">
              <div className="mb-10 border-l-8 border-[#005f60] pl-6 py-2">
                <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Sensação Auditiva</h3>
                <p className="text-slate-600 text-lg leading-relaxed">Como você se sentiu ao ouvir esse som ?</p>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {FEELINGS.map((f) => (
                  <button
                    key={f.label}
                    onClick={() => handleFeelingSubmit(f.label)}
                    className={`flex flex-col items-center p-8 border-2 rounded-3xl transition-all active:scale-95 group ${f.color} shadow-sm hover:shadow-md`}
                  >
                    <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</span>
                    <span className="font-black uppercase text-xs tracking-[0.2em]">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === Step.SUMMARY && (
            <div className="flex-1 flex flex-col animate-in fade-in duration-1000">
              <div className="bg-[#005f60] p-10 rounded-[3rem] mb-8 relative overflow-hidden text-white shadow-2xl border-b-8 border-[#004243]">
                <div className="absolute -top-6 -right-6 p-12 opacity-10 text-9xl">🛡️</div>
                <h3 className="font-black text-teal-200 text-xs uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  FRASE APRESENTADA:
                </h3>
                <p className="text-3xl font-black tracking-tight leading-tight mb-10 text-white italic">
                  "{phrase}"
                </p>
                <div className="h-0.5 bg-white/20 w-full mb-10"></div>
                
                <h3 className="font-black text-teal-200 text-xs uppercase tracking-[0.4em] mb-6">
                  ANÁLISE DO ESPECIALISTA:
                </h3>
                {isLoadingAdvice ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-white/20 rounded-full w-full"></div>
                    <div className="h-4 bg-white/20 rounded-full w-4/5"></div>
                  </div>
                ) : (
                  <p className="text-lg text-teal-50 leading-relaxed font-bold">
                    {advice}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-4 mt-auto">
                <button 
                  onClick={resetToMenu}
                  className="w-full py-5 bg-[#005f60] hover:bg-[#004d4e] text-white font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#005f60]/20 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  NOVA SIMULAÇÃO
                </button>
                <button 
                  onClick={resetAll}
                  className="w-full py-5 border-2 border-slate-300 text-slate-500 font-black rounded-2xl hover:bg-slate-50 transition-all active:scale-95 uppercase text-xs tracking-[0.3em]"
                >
                  FINALIZAR TREINAMENTO
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-10 py-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 rounded-full bg-[#005f60] animate-pulse"></div>
            <p className="text-[11px] text-[#005f60] font-black uppercase tracking-[0.3em]">
              Cuidar para Ouvir Melhor
            </p>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">PCA</span>
            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
            <p className="text-[9px] font-bold uppercase tracking-widest">
              GE Vernova • Proteção Auditiva
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-12 flex flex-col items-center gap-8 pb-10">
        <div className="flex items-center gap-10 grayscale opacity-40">
           <span className="text-[10px] font-black text-slate-600 tracking-[0.4em]">GE VERNOVA</span>
           <span className="text-[10px] font-black text-slate-600 tracking-[0.4em]">PCA</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-slate-400 text-[9px] font-black tracking-[0.6em] uppercase text-center">
            &copy; 03 DE MARÇO DE 2026 • DIA MUNDIAL DA AUDIÇÃO
          </p>
          <div className="w-40 h-0.5 bg-slate-200 rounded-full mt-2"></div>
        </div>
      </footer>
    </div>
  );
}
