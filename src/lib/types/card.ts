export type Card = { id: string; prompt: string; answer: string; tags: string[]; createdAt: Date; userId: string };

export enum TabKey {
  Manual = "manual",
  Quick = "quick",
  Cards = "cards",
}

export type NewCardInput = {
  prompt: string;
  answer: string;
  tags: string[];
};

export type CardDTO = {
  id: string;
  prompt: string;
  answer: string;
  tags: string[];
  createdAt: string | Date;
};