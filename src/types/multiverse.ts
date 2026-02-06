export type MultiverseEntityType = 'habit' | 'course' | 'video' | 'note' | 'achievement';
export type MultiverseRelationType = 'prerequisite' | 'dependency' | 'synergy' | 'spawn' | 'reference';

export interface MultiverseLink {
    id: string;
    userId: string;
    sourceType: MultiverseEntityType;
    sourceId: string;
    targetType: MultiverseEntityType;
    targetId: string;
    relationType: MultiverseRelationType;
    metadata?: any;
    createdAt?: string;
}

export interface MultiverseNode {
    id: string;
    type: MultiverseEntityType;
    title: string;
    subtitle?: string;
    status: 'active' | 'completed' | 'locked';
    metadata?: any;
}
