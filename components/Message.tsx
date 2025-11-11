
import React from 'react';
import { ChatMessage, Sender } from '../types';
import { UserIcon, PatientIcon } from './icons';

interface MessageProps {
  message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.sender === Sender.User;
  const isPatient = message.sender === Sender.Patient;
  const isSystem = message.sender === Sender.System;

  if (isSystem) {
    return (
      <div className="my-4 text-center text-xs text-slate-400 italic">
        <p>{message.text}</p>
      </div>
    );
  }

  const wrapperClass = isUser ? 'justify-end' : 'justify-start';
  const bubbleClass = isUser
    ? 'bg-blue-600 text-white rounded-br-none'
    : 'bg-slate-700 text-slate-200 rounded-bl-none';
  
  const Icon = isUser ? UserIcon : PatientIcon;
  const iconOrder = isUser ? 'order-2' : 'order-1';
  const textOrder = isUser ? 'order-1' : 'order-2';

  return (
    <div className={`flex items-end gap-2 my-3 ${wrapperClass}`}>
        <div className={iconOrder}>
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                 <Icon className="h-5 w-5 text-slate-300" />
            </div>
        </div>
        <div className={`px-4 py-2 rounded-lg max-w-xs md:max-w-md ${bubbleClass} ${textOrder}`}>
            <p className="text-sm">{message.text}</p>
        </div>
    </div>
  );
};

export default Message;
