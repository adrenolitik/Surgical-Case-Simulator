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
    <div className="bg-slate-800/50 rounded-lg flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold">Consultation with Alex (22M)</h2>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <Message key={index} message={msg} />
        ))}
        {isLoading && (
            <div className="flex justify-start items-end gap-2 my-3">
                 <div className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 rounded-bl-none">
                    <Spinner />
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center bg-slate-700 rounded-lg">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isRecording ? "Listening..." : "Type or use the microphone..."}
            className="w-full bg-transparent p-3 focus:outline-none text-slate-200 placeholder-slate-400"
            disabled={isLoading}
          />
          <button
            onClick={onToggleRecording}
            className={`p-3 transition-colors ${isRecording ? 'text-red-500' : 'text-slate-400 hover:text-blue-500'}`}
            >
            {isRecording ? <StopCircleIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
          </button>
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-3 text-slate-400 hover:text-blue-500 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;