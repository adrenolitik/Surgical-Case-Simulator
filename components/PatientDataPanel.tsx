import React, { useState } from 'react';
import { DataTab, PatientData } from '../types';
import Spinner from './Spinner';
import { ClipboardIcon, CheckCircleIcon } from './icons';

interface PatientAvatarProps {
    avatarUrl: string | null;
    isLoading: boolean;
    isSpeaking: boolean;
}

const PatientAvatar: React.FC<PatientAvatarProps> = ({ avatarUrl, isLoading, isSpeaking }) => {
    return (
        <div className="flex flex-col items-center p-4 border-b border-slate-700">
            <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden mb-2">
                {isLoading ? (
                    <Spinner />
                ) : avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="Patient Alex"
                        className={`w-full h-full object-cover transition-all duration-300 ${isSpeaking ? 'ring-4 ring-blue-500 shadow-lg' : 'ring-2 ring-slate-600'}`}
                    />
                ) : (
                    <div className="text-slate-400">No Image</div>
                )}
            </div>
            <h2 className="text-lg font-bold">Patient Chart: Alex (22M)</h2>
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
}) => {
    const [activeTab, setActiveTab] = useState<DataTab>(DataTab.Exam);
    const [submission, setSubmission] = useState('');
    const [copied, setCopied] = useState(false);

    const handleCopyToClipboard = () => {
        if (evaluation) {
            navigator.clipboard.writeText(evaluation);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSubmit = () => {
        if (submission.trim()) {
            onEvaluate(submission);
        }
    };

    const renderTabContent = () => {
        if (isDataLoading[activeTab]) {
            return (
                <div className="flex justify-center items-center h-48">
                    <Spinner />
                </div>
            );
        }

        const data = patientData[activeTab];
        if (!data) {
            return (
                <div className="text-center p-8">
                    <p className="mb-4 text-slate-400">
                        This data is not yet available.
                    </p>
                    <button
                        onClick={() => onGenerateData(activeTab)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        Generate {activeTab}
                    </button>
                </div>
            );
        }
        return <div className="p-4 whitespace-pre-wrap text-sm text-slate-300">{data}</div>;
    };

    return (
        <div className="bg-slate-800/50 rounded-lg flex flex-col h-full">
            <PatientAvatar avatarUrl={patientAvatarUrl} isLoading={isAvatarLoading} isSpeaking={isPatientSpeaking} />

            <div className="flex-grow flex flex-col min-h-0">
                <div className="border-b border-slate-700">
                    <nav className="flex space-x-2 p-2">
                        {Object.values(DataTab).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    activeTab === tab
                                        ? 'bg-slate-700 text-white'
                                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {renderTabContent()}
                </div>
                <div className="p-4 border-t border-slate-700">
                     <h3 className="text-md font-semibold mb-2">Diagnosis &amp; Plan</h3>
                     <textarea
                        value={submission}
                        onChange={(e) => setSubmission(e.target.value)}
                        placeholder="Enter your final diagnosis and treatment plan here..."
                        className="w-full h-24 bg-slate-700 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-200 placeholder-slate-400 text-sm"
                        disabled={isEvaluating}
                     />
                     <button
                        onClick={handleSubmit}
                        disabled={isEvaluating || !submission.trim()}
                        className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                     >
                        {isEvaluating ? <Spinner /> : 'Submit for Evaluation'}
                     </button>
                     {evaluation && (
                         <div className="mt-4 p-3 bg-slate-900 rounded-lg">
                             <div className="flex justify-between items-center mb-2">
                                <h4 className="text-md font-semibold">Evaluation Feedback</h4>
                                <button onClick={handleCopyToClipboard} className="text-slate-400 hover:text-white">
                                    {copied ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5" />}
                                </button>
                             </div>
                             <div className="whitespace-pre-wrap text-sm text-slate-300">{evaluation}</div>
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default PatientDataPanel;
