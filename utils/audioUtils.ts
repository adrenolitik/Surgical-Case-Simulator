
function decode(base64: string): Uint8Array {
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
): Promise<AudioBuffer> {
  const sampleRate = 24000; // Gemini TTS model sample rate
  const numChannels = 1;
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

export async function playAudio(
  base64Audio: string, 
  audioContext: AudioContext, 
  onEnded: () => void,
  analyser?: AnalyserNode
) {
    if (!base64Audio || !audioContext) {
        onEnded();
        return;
    };
    try {
        const audioBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, audioContext);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // Connect to destination
        source.connect(audioContext.destination);
        
        // Connect to analyser if provided for lip-sync
        if (analyser) {
            source.connect(analyser);
        }

        source.onended = onEnded;
        source.start();
    } catch (error) {
        console.error("Failed to play audio:", error);
        onEnded(); 
    }
}
