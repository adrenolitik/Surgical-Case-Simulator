
import React, { useState, useEffect, useRef } from 'react';
import ChatPanel from './components/ChatPanel';
import PatientDataPanel from './components/PatientDataPanel';
import { ChatMessage, DataTab, PatientData, Sender, Gender, PatientProfile, EvaluationReport } from './types';
import { INITIAL_MESSAGES } from './constants';
import { startPatientChat, getPatientResponse, generatePatientData, evaluateDiagnosis, generatePatientImage, generateSpeech } from './services/geminiService';
import { playAudio } from './utils/audioUtils';
import { Chat } from '@google/genai';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const [patientAvatarUrl, setPatientAvatarUrl] = useState<string | null>(null);
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);
  const [isPatientSpeaking, setIsPatientSpeaking] = useState(false);
  const [speechVolume, setSpeechVolume] = useState(0);

  const [patientProfile] = useState<PatientProfile>({
    name: "Arjun Nair",
    age: 22,
    gender: Gender.Male,
    location: "Mumbai, India",
    occupation: "Student"
  });

  const patientVoice: 'Kore' | 'Puck' = patientProfile.gender === Gender.Male ? 'Kore' : 'Puck';

  const [patientData, setPatientData] = useState<PatientData>({
    [DataTab.History]: null,
    [DataTab.Exam]: null,
    [DataTab.Labs]: null,
    [DataTab.Imaging]: null,
  });
  const [isDataLoading, setIsDataLoading] = useState<Record<DataTab, boolean>>({
      [DataTab.History]: false,
      [DataTab.Exam]: false,
      [DataTab.Labs]: false,
      [DataTab.Imaging]: false,
  });

  const [evaluation, setEvaluation] = useState<EvaluationReport | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; color: string; left: string; delay: string }[]>([]);

  const chatRef = useRef<Chat | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    chatRef.current = startPatientChat();
    
    const fetchInitialData = async () => {
        setIsAvatarLoading(true);
        try {
            // Загружаем аватар
            const imageBytes = await generatePatientImage();
            setPatientAvatarUrl(`data:image/jpeg;base64,${imageBytes}`);
            
            // Автоматически загружаем историю болезни (Medical History)
            handleGenerateData(DataTab.History);
        } catch (error) {
            console.error("Failed to load initial data:", error);
        } finally {
            setIsAvatarLoading(false);
        }
    };
    
    fetchInitialData();

    if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
              setInput(prev => (prev ? prev + ' ' : '') + finalTranscript.trim());
            }
        };
        
        recognitionRef.current.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            setIsRecording(false);
            isRecordingRef.current = false;
        };

        recognitionRef.current.onend = () => {
            if (isRecordingRef.current) {
              recognitionRef.current.start();
            }
        };
    }

    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const startVolumeAnalysis = () => {
      if (!analyserRef.current) return;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const analyze = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setSpeechVolume(Math.min(average / 110, 1));
          animationFrameRef.current = requestAnimationFrame(analyze);
      };
      analyze();
  };

  const stopVolumeAnalysis = () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setSpeechVolume(0);
      setIsPatientSpeaking(false);
  };
  
  const addMessage = (sender: Sender, text: string) => {
      setMessages(prev => [...prev, { sender, text }]);
  };

  const handleDataUnlock = async (response: string) => {
    let unlocked = false;
    if (response.includes('[UNLOCK_EXAM]')) {
      handleGenerateData(DataTab.Exam);
      unlocked = true;
    }
    if (response.includes('[UNLOCK_LABS]')) {
      handleGenerateData(DataTab.Labs);
      unlocked = true;
    }
    if (response.includes('[UNLOCK_IMAGING]')) {
      handleGenerateData(DataTab.Imaging);
      unlocked = true;
    }
    
    const cleanResponse = response
        .replace(/\[UNLOCK_EXAM\]/g, '')
        .replace(/\[UNLOCK_LABS\]/g, '')
        .replace(/\[UNLOCK_IMAGING\]/g, '')
        .trim();

    if (cleanResponse) {
      addMessage(Sender.Patient, cleanResponse);
      try {
        const audioData = await generateSpeech(cleanResponse, patientVoice);
        
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
        }

        setIsPatientSpeaking(true);
        startVolumeAnalysis();
        
        playAudio(
            audioData, 
            audioContextRef.current, 
            stopVolumeAnalysis,
            analyserRef.current || undefined
        );
      } catch (e) {
        console.error("Speech generation failed:", e);
      }
    }
    if (unlocked) {
      addMessage(Sender.System, '✨ Clinical insight achieved: New medical data generated.');
    }
  };


  const handleSendMessage = async (message: string) => {
    if (!chatRef.current || !message.trim()) return;
    
    if (isRecordingRef.current) {
      handleToggleRecording();
    }

    setInput('');
    addMessage(Sender.User, message);
    setIsLoading(true);

    try {
      const response = await getPatientResponse(chatRef.current, message);
      await handleDataUnlock(response);
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage(Sender.System, "Communication error. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateData = async (tab: DataTab) => {
      // Если данные уже есть или грузятся — ничего не делаем
      if (patientData[tab] || isDataLoading[tab]) return;
      
      setIsDataLoading(prev => ({ ...prev, [tab]: true }));
      try {
          const data = await generatePatientData(tab);
          setPatientData(prev => ({...prev, [tab]: data }));
      } catch (error) {
          console.error(`Error generating data for ${tab}:`, error);
      } finally {
          setIsDataLoading(prev => ({ ...prev, [tab]: false }));
      }
  };

  const triggerCelebration = () => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const newConfetti = Array.from({ length: 50 }).map((_, i) => ({
      id: Date.now() + i,
      color: colors[Math.floor(Math.random() * colors.length)],
      left: `${Math.random() * 100}vw`,
      delay: `${Math.random() * 2}s`,
    }));
    setConfetti(newConfetti);
    setTimeout(() => setConfetti([]), 5000);
  };

  const handleEvaluate = async (submission: string) => {
      setIsEvaluating(true);
      setEvaluation(null);
      try {
          const report = await evaluateDiagnosis(submission);
          setEvaluation(report);
          if (report.score >= 80) triggerCelebration();
      } catch (error) {
          console.error("Error during evaluation:", error);
      } finally {
          setIsEvaluating(false);
      }
  };

  const handleToggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    if (isRecordingRef.current) {
        recognitionRef.current.stop();
        setIsRecording(false);
        isRecordingRef.current = false;
        
        setTimeout(() => {
          const currentInput = (document.querySelector('input[type="text"]') as HTMLInputElement)?.value;
          if (currentInput?.trim()) {
            handleSendMessage(currentInput.trim());
          }
        }, 300);
    } else {
        setInput('');
        recognitionRef.current.start();
        setIsRecording(true);
        isRecordingRef.current = true;
    }
  };

  return (
    <div className="bg-slate-900 text-white h-screen flex flex-col font-sans relative overflow-hidden">
      {confetti.map((c) => (
        <div
          key={c.id}
          className="confetti"
          style={{
            backgroundColor: c.color,
            left: c.left,
            animationDelay: c.delay,
          }}
        />
      ))}
      <header className="p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur-md z-10">
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Surgical Diagnosis Simulator: {patientProfile.name}
        </h1>
      </header>
      <main className="flex-grow p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden z-10">
        <div className="h-full min-h-0">
          <ChatPanel 
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            input={input}
            setInput={setInput}
            isRecording={isRecording}
            onToggleRecording={handleToggleRecording}
          />
        </div>
        <div className="h-full min-h-0">
          <PatientDataPanel 
            patientData={patientData}
            onGenerateData={handleGenerateData}
            isDataLoading={isDataLoading}
            evaluation={evaluation}
            onEvaluate={handleEvaluate}
            isEvaluating={isEvaluating}
            patientAvatarUrl={patientAvatarUrl}
            isAvatarLoading={isAvatarLoading}
            isPatientSpeaking={isPatientSpeaking}
            speechVolume={speechVolume}
            patientProfile={patientProfile}
          />
        </div>
      </main>
    </div>
  );
}

export default App;