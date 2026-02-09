
import { GoogleGenAI, Modality } from "@google/genai";
import { TinnitusType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Gera uma frase educativa. Retorna frases fixas para os tipos Tonal, Chiado, Pulsátil e Grilo,
 * e gera frases curtas dinâmicas para outros casos se necessário.
 */
export async function generateInformativePhrase(type: TinnitusType): Promise<string> {
  if (type === TinnitusType.TONAL) {
    return "Cuidar da minha audição é garantir qualidade de vida amanhã";
  }
  if (type === TinnitusType.HISSING) {
    return "Ouça risadas, músicas e a natureza — não deixe o zumbido ocupar esse espaço.";
  }
  if (type === TinnitusType.PULSATILE) {
    return "Ouvir a vida sem ruídos é um presente — preserve isso.";
  }
  if (type === TinnitusType.CRICKET) {
    return "Que seus ouvidos guardem apenas o que faz bem ao coração.";
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Gere uma frase educativa extremamente curta e simples (de 3 a 5 palavras) sobre saúde auditiva. Exemplo: 'Use protetor auricular', 'Evite barulhos altos', 'Cuide dos seus ouvidos'. Retorne apenas a frase.",
  });
  return response.text.trim().replace(/[".]/g, '');
}

/**
 * Converte texto em áudio usando o modelo Gemini TTS.
 */
export async function generateSpeechAudio(text: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Diga de forma clara e profissional: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // Voz firme e clara
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Falha ao gerar áudio de voz.");
  return base64Audio;
}

/**
 * Utilitário para decodificar base64 em AudioBuffer.
 */
export async function decodeAudioBuffer(base64: string, ctx: AudioContext): Promise<AudioBuffer> {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000); // Sample rate do Gemini TTS
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export async function generatePersonalizedAdvice(tinnitusType: string, feeling: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Como um especialista em saúde auditiva, dê um conselho curto (máximo 25 words) e empático para um colaborador que experimentou uma simulação de "${tinnitusType}" e sentiu-se "${feeling}". Em português do Brasil.`,
  });
  return response.text.trim();
}
