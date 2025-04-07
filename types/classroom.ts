export type classroom = {
  id: string;
  name: string;
  start_time: Date;
  duration: number; // in minutes
  status: "active" | "inactive";
  sections: string[];
  visibility: boolean;
  maxusers: number;
};

export type Session = {
  id: string;
  users: string[];
  max_score: number;
  visibility: boolean;
  classroom_id: string;
};
