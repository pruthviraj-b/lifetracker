export interface RecallEntry {
  id: string;
  userId: string;
  content: string;
  category?: string;
  createdAt: string;
}

export interface CreateRecallInput {
  content: string;
  category?: string;
}
