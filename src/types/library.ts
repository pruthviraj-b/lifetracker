export interface LibraryItem {
  id: string;
  userId: string;
  title: string;
  url?: string;
  category?: string;
  createdAt: string;
}

export interface CreateLibraryItemInput {
  title: string;
  url?: string;
  category?: string;
}
