import { create } from 'zustand';

export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
    id: string;
    role: Role;
    content: string;
}

interface ChatState {
    messages: ChatMessage[];
    turnCount: number; // Maximum 5 turns
    maxTurns: number;
    isProcessing: boolean;
    addMessage: (message: Omit<ChatMessage, 'id'>) => void;
    incrementTurn: () => void;
    resetChat: () => void;
    submitSession: (userId: string, moduleName: string) => Promise<void>;
}

export const useChatStore = create<ChatState>()((set, get) => ({
    messages: [],
    turnCount: 0,
    maxTurns: 5,
    isProcessing: false,

    addMessage: (message) => {
        const newMessage: ChatMessage = {
            ...message,
            id: crypto.randomUUID(),
        };
        set((state) => ({
            messages: [...state.messages, newMessage],
        }));
    },

    incrementTurn: () => {
        set((state) => ({ turnCount: state.turnCount + 1 }));
    },

    resetChat: () => {
        set({ messages: [], turnCount: 0, isProcessing: false });
    },

    submitSession: async (userId: string, moduleName: string) => {
        const { messages } = get();
        // Do not submit if already processing or no messages exist
        if (messages.length === 0) return;

        set({ isProcessing: true });

        try {
            // Send a single batch POST request to backend to evaluate and save
            // This minimizes database write costs and latency by bypassing single-turn DB saves
            const response = await fetch('/api/evaluate-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    moduleName,
                    messages,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit session to backend');
            }

            const result = await response.json();
            // Result will contain the 5-axes radar chart scores and XP
            console.log('Session saved and evaluated successfully:', result);

            // Update local storage or profile state with new XP if needed
        } catch (error) {
            console.error('Error submitting session:', error);
        } finally {
            set({ isProcessing: false });
        }
    },
}));
