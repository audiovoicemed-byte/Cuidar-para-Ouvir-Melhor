// Dentro do seu AudioEngine.tsx

// Função para carregar o arquivo MP3 uma única vez
const loadAudioFile = async (url: string) => {
  if (!audioCtxRef.current) return;
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await audioCtxRef.current.decodeAudioData(arrayBuffer);
};

// ... dentro do componente:

useEffect(() => {
  const setupAudio = async () => {
    if (isPlaying && selectedType) {
      // 1. Inicia o contexto se não existir
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // 2. Carrega o MP3 específico para o tipo de zumbido selecionado
      // Exemplo: /public/tonal.mp3
      const buffer = await loadAudioFile(`/${type.toLowerCase()}.mp3`);
      
      // 3. Inicia a simulação (Zumbido)
      startSimulation();
      
      // 4. Toca a voz pela primeira vez
      if (buffer) {
        // Guardamos o buffer para repetir depois sem precisar baixar de novo
        voiceBufferRef.current = buffer; 
        startVoice(buffer);
      }
    } else {
      stopAll();
    }
  };
  setupAudio();
}, [isPlaying, type]); // Só recarrega o MP3 se mudar o tipo ou play/pause

// GATILHO DO BOTÃO REINICIAR
useEffect(() => {
  if (isPlaying && voiceTrigger > 0 && voiceBufferRef.current) {
    // REPETIR: Toca a voz novamente usando o buffer que já está na memória
    startVoice(voiceBufferRef.current);
  }
}, [voiceTrigger]);
