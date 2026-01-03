
import React, { useState, useRef, useEffect } from 'react';
import { DataTab, PatientData, PatientProfile, Gender } from '../types';
import Spinner from './Spinner';
import { ClipboardIcon, CheckCircleIcon, MicrophoneIcon, StopCircleIcon } from './icons';

// Polyfill for speech recognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface PatientAvatarProps {
    avatarUrl: string | null;
    isLoading: boolean;
    isSpeaking: boolean;
    speechVolume: number; // Volume 0 to 1
    profile: PatientProfile;
}

const PatientAvatar: React.FC<PatientAvatarProps> = ({ avatarUrl, isLoading, isSpeaking, speechVolume, profile }) => {
    const jawTranslation = isSpeaking ? speechVolume * 16 : 0;
    const activeWince = isSpeaking ? speechVolume * 0.2 : 0;
    const baseWinceScale = 1 + activeWince;

    return (
        <div className="flex flex-col items-center p-4 border-b border-slate-700">
            <div className={`relative w-40 h-40 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden mb-2 ring-4 transition-all duration-500 ${isSpeaking ? 'ring-blue-500 shadow-xl shadow-blue-500/30 scale-105' : 'ring-slate-600 shadow-inner'}`}>
                {isLoading ? (
                    <Spinner />
                ) : avatarUrl ? (
                    <div className="w-full h-full relative" style={{ transform: `scale(${baseWinceScale})` }}>
                        <img
                            src={avatarUrl}
                            alt={profile.name}
                            className={`absolute inset-0 w-full h-full object-cover ${isSpeaking ? 'animate-pain-spasm' : 'animate-pain-wince'}`}
                            style={{ 
                                clipPath: 'inset(0 0 45% 0)', 
                                transition: 'transform 0.15s ease-out, filter 0.3s ease',
                                filter: isSpeaking ? `saturate(${1 + speechVolume}) contrast(${1 + speechVolume * 0.2})` : 'none'
                            }}
                        />
                        <img
                            src={avatarUrl}
                            alt={profile.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ 
                                clipPath: 'inset(45% 0 0 0)', 
                                transform: `translateY(${jawTranslation}px)`,
                                transition: 'transform 0.08s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}
                        />
                        {isSpeaking && (
                            <div className="absolute inset-0 bg-blue-500/5 flex items-center justify-center pointer-events-none">
                                <div className="flex space-x-1.5 items-end h-20 opacity-60">
                                    <div className="w-1.5 bg-blue-500/50 rounded-t-full transition-all duration-75" style={{ height: `${15 + speechVolume * 85}%` }}></div>
                                    <div className="w-2 bg-blue-400 rounded-t-full transition-all duration-75" style={{ height: `${30 + speechVolume * 70}%` }}></div>
                                    <div className="w-1.5 bg-blue-500/50 rounded-t-full transition-all duration-75" style={{ height: `${20 + speechVolume * 80}%` }}></div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-slate-400 text-xs font-mono">ENCRYPTED_IMG</div>
                )}
            </div>
            <div className="text-center">
                <h2 className="text-lg font-bold flex items-center justify-center gap-2">
                    {profile.name} ({profile.age}{profile.gender === Gender.Male ? 'M' : 'F'})
                </h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{profile.location} | {profile.occupation}</p>
            </div>
        </div>
    );
};


interface PatientDataPanelProps {
    patientData: PatientData;
    onGenerateData: (tab: DataTab) => void;
    isDataLoading: Record<DataTab, boolean>;
    evaluation: string | null;
    onEvaluate: (submission: string) => void;
    isEvaluating: boolean;
    patientAvatarUrl: string | null;
    isAvatarLoading: boolean;
    isPatientSpeaking: boolean;
    speechVolume: number;
    patientProfile: PatientProfile;
}

const PatientDataPanel: React.FC<PatientDataPanelProps> = ({
    patientData,
    onGenerateData,
    isDataLoading,
    evaluation,
    onEvaluate,
    isEvaluating,
    patientAvatarUrl,
    isAvatarLoading,
    isPatientSpeaking,
    speechVolume,
    patientProfile,
}) => {
    const [activeTab, setActiveTab] = useState<DataTab>(DataTab.History);
    const [submission, setSubmission] = useState('');
    const [copied, setCopied] = useState(false);
    const [isRecordingSubmission, setIsRecordingSubmission] = useState(false);
    
    const recognitionRef = useRef<any | null>(null);

    useEffect(() => {
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        const transcript = event.results[i][0].transcript;
                        setSubmission(prev => (prev ? prev + ' ' : '') + transcript.trim());
                    }
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error in submission:", event.error);
                setIsRecordingSubmission(false);
            };

            recognitionRef.current.onend = () => {
                setIsRecordingSubmission(false);
            };
        }
    }, []);

    const handleToggleRecording = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in your browser.");
            return;
        }

        if (isRecordingSubmission) {
            recognitionRef.current.stop();
            setIsRecordingSubmission(false);
        } else {
            recognitionRef.current.start();
            setIsRecordingSubmission(true);
        }
    };

    const handleCopyToClipboard = () => {
        if (evaluation) {
            navigator.clipboard.writeText(evaluation);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSubmit = () => {
        if (isRecordingSubmission) {
            recognitionRef.current.stop();
            setIsRecordingSubmission(false);
        }
        if (submission.trim()) {
            onEvaluate(submission);
        }
    };

    const renderTabContent = () => {
        if (isDataLoading[activeTab]) {
            return (
                <div className="flex flex-col justify-center items-center h-48 gap-3">
                    <Spinner />
                    <p className="text-xs text-blue-400 animate-pulse uppercase tracking-widest font-bold">Accessing Secure Records...</p>
                </div>
            );
        }

        const data = patientData[activeTab];
        if (!data) {
            return (
                <div className="text-center p-8">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                        <ClipboardIcon className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="mb-4 text-slate-400 text-sm">
                        This specific information has not been retrieved from the chart yet.
                    </p>
                    <button
                        onClick={() => onGenerateData(activeTab)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-all shadow-lg active:scale-95"
                    >
                        Retrieve Data
                    </button>
                </div>
            );
        }
        return (
            <div className="p-4 animate-in fade-in duration-500">
                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50 whitespace-pre-wrap text-sm text-slate-300 font-mono leading-relaxed shadow-inner overflow-x-auto">
                    {data}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-slate-800/50 rounded-lg flex flex-col h-full border border-slate-700 shadow-2xl">
            <PatientAvatar 
                avatarUrl={patientAvatarUrl} 
                isLoading={isAvatarLoading} 
                isSpeaking={isPatientSpeaking} 
                speechVolume={speechVolume}
                profile={patientProfile}
            />

            {/* Clinical Brief Section - Always Visible Overview */}
            <div className="px-4 py-2 bg-blue-900/20 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Clinical Brief</span>
                    <span className="text-[10px] text-slate-500 italic">Auto-Synced</span>
                </div>
                <div className="flex gap-4 mt-1">
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-300">Triage Status</p>
                        <p className="text-[10px] text-red-400 font-bold uppercase animate-pulse">Acute Abdomen</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-300">Main Symptom</p>
                        <p className="text-[10px] text-slate-400">Migratory RLQ Pain</p>
                    </div>
                    <div className="flex-1 text-right">
                        <p className="text-xs font-semibold text-slate-300">Case ID</p>
                        <p className="text-[10px] text-slate-500">#SURG-77421</p>
                    </div>
                </div>
            </div>

            <div className="flex-grow flex flex-col min-h-0">
                <div className="border-b border-slate-700 bg-slate-800/80">
                    <nav className="flex space-x-1 p-2 overflow-x-auto no-scrollbar">
                        {Object.values(DataTab).map((tab) => {
                            const isLoaded = !!patientData[tab];
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`relative px-3 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                        activeTab === tab
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                                    }`}
                                >
                                    {tab}
                                    {isLoaded && (
                                        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center animate-in zoom-in">
                                            <CheckCircleIcon className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex-grow overflow-y-auto bg-slate-900/30 scroll-smooth">
                    {renderTabContent()}
                </div>
                <div className="p-4 border-t border-slate-700 bg-slate-800/80">
                     <div className="flex justify-between items-center mb-2">
                         <h3 className="text-sm font-bold flex items-center gap-2 text-slate-200">
                            <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center">
                                <ClipboardIcon className="w-5 h-5 text-blue-400" />
                            </div>
                            Diagnostic Submission
                         </h3>
                         <button 
                            onClick={handleToggleRecording}
                            className={`p-1.5 rounded-full transition-all ${isRecordingSubmission ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-blue-400 hover:bg-slate-700'}`}
                            title={isRecordingSubmission ? "Stop Recording" : "Voice Input"}
                         >
                            {isRecordingSubmission ? <StopCircleIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                         </button>
                     </div>
                     <div className="relative">
                        <textarea
                            value={submission}
                            onChange={(e) => setSubmission(e.target.value)}
                            placeholder={isRecordingSubmission ? "Listening... Speak your diagnosis clearly." : "Type diagnosis & surgical plan..."}
                            className={`w-full h-20 bg-slate-900 p-3 rounded-md border transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-200 placeholder-slate-500 text-sm resize-none ${isRecordingSubmission ? 'border-red-500/50' : 'border-slate-700'}`}
                            disabled={isEvaluating}
                        />
                     </div>
                     <button
                        onClick={handleSubmit}
                        disabled={isEvaluating || !submission.trim()}
                        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-md transition-all shadow-lg active:scale-95 disabled:bg-slate-700 disabled:cursor-not-allowed flex justify-center items-center gap-2 group"
                     >
                        {isEvaluating ? <Spinner /> : (
                            <>
                                <span>Submit for Review</span>
                                <CheckCircleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </>
                        )}
                     </button>
                     {evaluation && (
                         <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                             <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded-lg shadow-2xl">
                                 <h4 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Attending Feedback
                                 </h4>
                                 <div className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed border-t border-slate-800 pt-3">{evaluation}</div>
                             </div>
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default PatientDataPanel;
