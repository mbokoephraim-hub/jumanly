/** The six reactions of the Chat's bar (docs/chat-v2, planche Chat-reaction), server and phone. */
export const REACTIONS = ["❤️", "👍", "🙏", "😊", "🎉", "👏"] as const;
export type Reaction = (typeof REACTIONS)[number];
