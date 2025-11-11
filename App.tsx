import React, { useState, useEffect, useRef } from 'react';
import ChatPanel from './components/ChatPanel';
import PatientDataPanel from './components/PatientDataPanel';
import { ChatMessage, DataTab, PatientData, Sender } from './types';
import { INITIAL_MESSAGES } from './constants';
import { startPatientChat, getPatientResponse, generatePatientData, evaluateDiagnosis, generatePatientImage, generateSpeech } from './services/geminiService';
import { playAudio } from './utils/audioUtils';
import { Chat } from '@google/genai';

// A polyfill for webkitSpeechRecognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const [patientAvatarUrl, setPatientAvatarUrl] = useState<string | null>(null);
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);
  const [isPatientSpeaking, setIsPatientSpeaking] = useState(false);

  const [patientData, setPatientData] = useState<PatientData>({
    [DataTab.Exam]: null,
    [DataTab.Labs]: null,
    [DataTab.Imaging]: null,
  });
  const [isDataLoading, setIsDataLoading] = useState<Record<DataTab, boolean>>({
      [DataTab.Exam]: false,
      [DataTab.Labs]: false,
      [DataTab.Imaging]: false,
  });

  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const chatRef = useRef<Chat | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    chatRef.current = startPatientChat();
    
    const fetchAvatar = async () => {
        setIsAvatarLoading(true);
        try {
            const imageBytes = await generatePatientImage();
            const url = `data:image/jpeg;base64,${imageBytes}`;
            setPatientAvatarUrl(url);
        } catch (error) {
            console.error("Failed to load patient avatar:", error);
            addMessage(Sender.System, "Error: Could not load patient image.");
        } finally {
            setIsAvatarLoading(false);
        }
    };
    fetchAvatar();

    if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0])
                .map((result) => result.transcript)
                .join('');
            setInput(transcript);
        };
        
        recognitionRef.current.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
            if (isRecording) {
              // If it stops unexpectedly, restart it
              recognitionRef.current.start();
            }
        };
    } else {
        console.warn("Speech recognition not supported in this browser.");
    }
  }, []);
  
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
        const audioData = await generateSpeech(cleanResponse);
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        setIsPatientSpeaking(true);
        playAudio(audioData, audioContextRef.current, () => setIsPatientSpeaking(false));
      } catch (e) {
        console.error("Speech generation failed:", e);
      }
    }
    if (unlocked) {
      addMessage(Sender.System, 'New patient data is now available in the "Patient Data" panel.');
    }
  };


  const handleSendMessage = async (message: string) => {
    if (!chatRef.current || !message.trim()) return;
    
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    setInput('');
    addMessage(Sender.User, message);
    setIsLoading(true);

    try {
      const response = await getPatientResponse(chatRef.current, message);
      await handleDataUnlock(response);
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage(Sender.System, "There was an error communicating with the patient. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateData = async (tab: DataTab) => {
      if (patientData[tab] || isDataLoading[tab]) return;
      
      setIsDataLoading(prev => ({ ...prev, [tab]: true }));
      try {
          const data = await generatePatientData(tab);
          setPatientData(prev => ({...prev, [tab]: data }));
      } catch (error) {
          console.error(`Error generating data for ${tab}:`, error);
          addMessage(Sender.System, `Failed to retrieve ${tab} data.`);
      } finally {
          setIsDataLoading(prev => ({ ...prev, [tab]: false }));
      }
  };

  const handleEvaluate = async (submission: string) => {
      setIsEvaluating(true);
      setEvaluation(null);
      try {
          const feedback = await evaluateDiagnosis(submission);
          setEvaluation(feedback);
      } catch (error) {
          console.error("Error during evaluation:", error);
          setEvaluation("An error occurred while evaluating your submission. Please try again.");
      } finally {
          setIsEvaluating(false);
      }
  };

  const handleToggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
        recognitionRef.current.stop();
        setIsRecording(false);
        if (input.trim()) {
            handleSendMessage(input.trim());
        }
    } else {
        setInput('');
        recognitionRef.current.start();
        setIsRecording(true);
    }
  };

  return (
    <div className="bg-slate-900 text-white h-screen flex flex-col font-sans">
      <header className="p-4 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-center">Surgical Diagnosis Simulator: Acute Appendicitis</h1>
      </header>
      <main className="flex-grow p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
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
          />
        </div>
      </main>
    </div>
  );
}

export default App;
