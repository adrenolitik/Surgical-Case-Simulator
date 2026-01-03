
import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import Message from './Message';
import Spinner from './Spinner';
import { SendIcon, MicrophoneIcon, StopCircleIcon } from './icons';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  input: string;
  setInput: (value: string) => void;
  isRecording: boolean;
  onToggleRecording: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
    messages, 
    onSendMessage, 
    isLoading,
    input,
    setInput,
    isRecording,
    onToggleRecording
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-lg flex flex-col h-full border border-slate-700 shadow-2xl relative overflow-hidden">
      {/* Voice Recording Overlay */}
      {isRecording && (
        <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
          <div className="p-8 rounded-full bg-red-500/20 border border-red-500/50 mb-6 relative">
            <div className="absolute inset-0 rounded-full animate-ping bg-red-500/10"></div>
            <MicrophoneIcon className="w-16 h-16 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Listening...</h3>
          <p className="text-slate-400 text-sm mb-6">Speak clearly into your microphone</p>
          
          <div className="flex items-end gap-1.5 h-12 mb-8">
            <div className="waveform-bar" style={{ animationDelay: '0s' }}></div>
            <div className="waveform-bar" style={{ animationDelay: '0.1s' }}></div>
            <div className="waveform-bar" style={{ animationDelay: '0.2s' }}></div>
            <div className="waveform-bar" style={{ animationDelay: '0.3s' }}></div>
            <div className="waveform-bar" style={{ animationDelay: '0.4s' }}></div>
            <div className="waveform-bar" style={{ animationDelay: '0.5s' }}></div>
            <div className="waveform-bar" style={{ animationDelay: '0.6s' }}></div>
            <div className="waveform-bar" style={{ animationDelay: '0.7s' }}></div>
          </div>

          <button 
            onClick={onToggleRecording}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full flex items-center gap-2 shadow-xl active:scale-95 transition-all"
          >
            <StopCircleIcon className="w-6 h-6" />
            <span>Stop Recording</span>
          </button>
        </div>
      )}

      <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex items-center justify-between">
        <h2 className="text-lg font-bold">Consultation: Arjun Nair</h2>
        <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live Session</span>
        </div>
      </div>
      
      <div className="flex-grow p-4 overflow-y-auto bg-slate-900/10">
        {messages.map((msg, index) => (
          <Message key={index} message={msg} />
        ))}
        {isLoading && (
            <div className="flex justify-start items-end gap-2 my-3">
                 <div className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 rounded-bl-none shadow-md">
                    <Spinner />
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-800/80">
        <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700 focus-within:border-blue-500 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Arjun about his symptoms..."
            className="w-full bg-transparent p-4 focus:outline-none text-slate-200 placeholder-slate-500"
            disabled={isLoading || isRecording}
          />
          <div className="flex items-center px-2 space-x-1">
              <button
                onClick={onToggleRecording}
                disabled={isLoading}
                className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-800 disabled:opacity-50'}`}
                title="Use Microphone"
                >
                <MicrophoneIcon className="w-6 h-6" />
              </button>
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim() || isRecording}
                className="p-2 text-slate-400 hover:text-blue-500 disabled:text-slate-700 disabled:cursor-not-allowed transition-all"
              >
                <SendIcon className="w-6 h-6" />
              </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center">Tip: Click the microphone icon to speak your questions naturally.</p>
      </div>
    </div>
  );
};

export default ChatPanel;
