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
  Exam = 'Physical Exam',
  Labs = 'Lab Results',
  Imaging = 'Imaging',
}

export interface PatientData {
  [DataTab.Exam]: string | null;
  [DataTab.Labs]: string | null;
  [DataTab.Imaging]: string | null;
}
