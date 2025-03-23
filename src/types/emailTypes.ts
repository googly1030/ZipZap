export interface EmailMetadata {
  sender: {
    name: string;
    role: string;
    company: string;
    email: string;
  };
}

export interface EmailModification {
  originalContent: string;
  modificationRequest: string;
}

export interface EmailResponse {
  subject: string;
  content: string;
}