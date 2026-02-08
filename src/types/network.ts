export interface NetworkConnection {
  id: string;
  userId: string;
  name: string;
  relationship?: string;
  sharedHabits?: string;
  createdAt: string;
}

export interface CreateNetworkConnectionInput {
  name: string;
  relationship?: string;
  sharedHabits?: string;
}
