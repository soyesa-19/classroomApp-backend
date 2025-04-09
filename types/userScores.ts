export type SessionSectionUserScore = {
  id: string;
  sessionId: string;
  sectionId: string;
  userId: string;
  score: number;
};

// Struct for {<sessionId>: {<userId>: <score>}}
export type SessionScores = Record<string, Record<string, number>>;
