export type Answer = { prompt: string; text: string };

export type PlayerResult = {
  name: string;
  count: number;
  totalPrompts: number;
  answers: Answer[];
};
