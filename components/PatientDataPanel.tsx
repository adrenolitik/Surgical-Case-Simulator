
import React, { useState, useRef, useEffect } from 'react';
import { DataTab, PatientData, PatientProfile, Gender, EvaluationReport } from '../types';
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
    evaluation: EvaluationReport | null;
    onEvaluate: (submission: string) => void;
    isEvaluating: boolean;
    patientAvatarUrl: string | null;
    isAvatarLoading: boolean;
    isPatientSpeaking: boolean;
    speechVolume: number;
    patientProfile: PatientProfile;
}

interface OrderItem {
    id: string;
    label: string;
    description: string;
    feedback: string;
    completed: boolean;
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
    const [isRecordingSubmission, setIsRecordingSubmission] = useState(false);
    
    // Critical Clinical Orders
    const [orders, setOrders] = useState<OrderItem[]>([
        { 
            id: 'npo', 
            label: 'NPO (Nil Per Os)', 
            description: 'Order the patient to have nothing by mouth.',
            feedback: 'Standard surgical practice. NPO status minimizes the risk of pulmonary aspiration of gastric contents during anesthesia induction.',
            completed: false 
        },
        { 
            id: 'ivf', 
            label: 'IV Fluid Resuscitation', 
            description: 'Start maintenance and replacement isotonic fluids.',
            feedback: 'Correct. Maintaining intravascular volume and electrolyte balance is vital, especially given potential third-space losses in inflammatory abdominal conditions.',
            completed: false 
        },
        { 
            id: 'abx', 
            label: 'IV Antibiotics', 
            description: 'Broad-spectrum coverage for gram-negative and anaerobes.',
            feedback: 'Critical step. Prophylactic antibiotics significantly reduce surgical site infections and are mandatory for suspected acute appendicitis before surgery.',
            completed: false 
        }
    ]);

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

    const handleTabClick = (tab: DataTab) => {
        setActiveTab(tab);
        if (!patientData[tab] && !isDataLoading[tab]) {
            onGenerateData(tab);
        }
    };

    const handleToggleOrder = (id: string) => {
        setOrders(prev => prev.map(order => 
            order.id === id ? { ...order, completed: !order.completed } : order
        ));
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
                        Clinical data for {activeTab} is currently restricted. Ask the patient relevant questions or request specialized workup.
                    </p>
                    <button
                        onClick={() => onGenerateData(activeTab)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-all shadow-lg active:scale-95"
                    >
                        Force Unlock Chart
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

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
        if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
        return 'text-red-400 border-red-500/30 bg-red-500/10';
    };

    return (
        <div className="bg-slate-800/50 rounded-lg flex flex-col h-full border border-slate-700 shadow-2xl overflow-hidden">
            <PatientAvatar 
                avatarUrl={patientAvatarUrl} 
                isLoading={isAvatarLoading} 
                isSpeaking={isPatientSpeaking} 
                speechVolume={speechVolume}
                profile={patientProfile}
            />

            <div className="flex-grow flex flex-col min-h-0">
                <div className="border-b border-slate-700 bg-slate-800/80">
                    <nav className="flex space-x-1 p-2 overflow-x-auto no-scrollbar">
                        {Object.values(DataTab).map((tab) => {
                            const isLoaded = !!patientData[tab];
                            const isLoading = isDataLoading[tab];
                            return (
                                <button
                                    key={tab}
                                    onClick={() => handleTabClick(tab)}
                                    className={`relative px-4 py-2.5 text-xs font-bold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                        activeTab === tab
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                                    }`}
                                >
                                    {tab}
                                    {isLoading && <div className="w-2 h-2 rounded-full bg-blue-300 animate-pulse"></div>}
                                    {isLoaded && !isLoading && (
                                        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center animate-in zoom-in">
                                            <CheckCircleIcon className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
                
                <div className="flex-grow overflow-y-auto bg-slate-900/30 scroll-smooth px-4 pt-4">
                    <div className="mb-6">
                        {renderTabContent()}
                    </div>

                    {/* INTERACTIVE CLINICAL ORDERS SECTION */}
                    <div className="mb-8 bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/30">
                                <ClipboardIcon className="w-5 h-5 text-blue-400" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Stat Pre-Op Orders</h3>
                        </div>
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div key={order.id} className="group">
                                    <div 
                                        onClick={() => handleToggleOrder(order.id)}
                                        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${order.completed ? 'bg-emerald-500/5 border-emerald-500/40' : 'bg-slate-900/40 border-slate-700 hover:border-slate-500 shadow-sm'}`}
                                    >
                                        <div className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${order.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600'}`}>
                                            {order.completed && <CheckCircleIcon className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-grow">
                                            <div className={`text-sm font-bold transition-colors ${order.completed ? 'text-emerald-400' : 'text-slate-200 group-hover:text-blue-400'}`}>
                                                {order.label}
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-1 leading-tight group-hover:text-slate-400">{order.description}</div>
                                        </div>
                                    </div>
                                    {order.completed && (
                                        <div className="mt-2 ml-9 p-3 text-[11px] text-emerald-100/80 border-l-2 border-emerald-500/30 bg-emerald-500/5 rounded-r-lg animate-in slide-in-from-left-2 duration-300 italic">
                                            "{order.feedback}"
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {evaluation && (
                        <div className="pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                             <div className={`p-6 rounded-xl border mb-6 flex flex-col items-center justify-center text-center shadow-xl ${getScoreColor(evaluation.score)}`}>
                                <div className="text-[10px] uppercase tracking-widest font-black mb-1 opacity-60">Performance Metric</div>
                                <div className="text-6xl font-black mb-2">{evaluation.score}</div>
                                <div className="text-sm font-semibold max-w-sm">{evaluation.overallSummary}</div>
                             </div>

                             <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 ml-1">Critical Task Analysis</h4>
                             <div className="space-y-3 mb-6">
                                {evaluation.criticalChecklist.map((item, i) => (
                                    <div key={i} className={`p-4 rounded-lg border flex gap-4 items-start ${item.status ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                        <div className={`p-1 rounded-full mt-0.5 ${item.status ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                            {item.status ? <CheckCircleIcon className="w-4 h-4" /> : <div className="w-4 h-4 flex items-center justify-center font-bold text-xs">X</div>}
                                        </div>
                                        <div>
                                            <div className={`text-sm font-bold ${item.status ? 'text-emerald-400' : 'text-red-400'}`}>{item.task}</div>
                                            <div className="text-xs text-slate-400 mt-1 leading-relaxed">{item.feedback}</div>
                                        </div>
                                    </div>
                                ))}
                             </div>

                             {evaluation.missedOpportunities.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 ml-1">Clinical Gaps</h4>
                                    <ul className="list-disc list-inside space-y-2 text-xs text-slate-400 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                        {evaluation.missedOpportunities.map((op, i) => (
                                            <li key={i}>{op}</li>
                                        ))}
                                    </ul>
                                </div>
                             )}

                             <div className="p-5 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-blue-300">Surgical Pearl</h4>
                                </div>
                                <div className="text-sm text-blue-100 italic leading-relaxed">"{evaluation.textbookInsight}"</div>
                             </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-800/80">
                     <div className="flex justify-between items-center mb-2">
                         <h3 className="text-sm font-bold flex items-center gap-2 text-slate-200">
                            <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center">
                                <ClipboardIcon className="w-5 h-5 text-blue-400" />
                            </div>
                            Diagnostic Impression & Plan
                         </h3>
                         <button 
                            onClick={handleToggleRecording}
                            className={`p-1.5 rounded-full transition-all ${isRecordingSubmission ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-blue-400 hover:bg-slate-700'}`}
                         >
                            {isRecordingSubmission ? <StopCircleIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                         </button>
                     </div>
                     <textarea
                        value={submission}
                        onChange={(e) => setSubmission(e.target.value)}
                        placeholder="State your diagnosis and definitive surgical management strategy..."
                        className="w-full h-24 bg-slate-900 p-3 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-200 text-sm resize-none"
                        disabled={isEvaluating}
                     />
                     <button
                        onClick={handleSubmit}
                        disabled={isEvaluating || !submission.trim()}
                        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-md transition-all shadow-lg active:scale-95 disabled:bg-slate-700 flex justify-center items-center gap-2"
                     >
                        {isEvaluating ? <Spinner /> : <span>Finalize Evaluation</span>}
                     </button>
                </div>
            </div>
        </div>
    );
};

export default PatientDataPanel;