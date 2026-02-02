export interface User {
    id: string;
    name: string;
    email: string;
    // RPG Stats
    level?: number;
    currentXP?: number;
    nextLevelXP?: number;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}
