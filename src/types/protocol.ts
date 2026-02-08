export interface ProtocolStep {
  label: string;
  minutes?: number;
}

export interface Protocol {
  id: string;
  userId: string;
  title: string;
  steps: ProtocolStep[];
  totalMinutes: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProtocolInput {
  title: string;
  steps: ProtocolStep[];
}
