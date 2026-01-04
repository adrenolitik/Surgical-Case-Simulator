
export enum Sender {
  User = 'user',
  Patient = 'patient',
  System = 'system',
}

export interface ChatMessage {
  sender: Sender;
  text: string;
}

export enum DataTab {
  History = 'Medical History',
  Exam = 'Physical Exam',
  Labs = 'Lab Results',
  Imaging = 'Imaging',
}

export enum Gender {
  Male = 'male',
  Female = 'female',
}

export interface PatientProfile {
  name: string;
  age: number;
  gender: Gender;
  location: string;
  occupation: string;
}

export interface PatientData {
  [DataTab.History]: string | null;
  [DataTab.Exam]: string | null;
  [DataTab.Labs]: string | null;
  [DataTab.Imaging]: string | null;
}

export interface CriticalTask {
  task: string;
  status: boolean;
  feedback: string;
}

export interface EvaluationReport {
  score: number;
  overallSummary: string;
  criticalChecklist: CriticalTask[];
  missedOpportunities: string[];
  textbookInsight: string;
}
