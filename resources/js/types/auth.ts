export type User = {
    id: number;
    name: string;
    email: string;
};

export type Auth = {
    user: User | null;
    /** false locally with AUTH_ENABLED=false (no login, no logout button) */
    loginRequired: boolean;
};
