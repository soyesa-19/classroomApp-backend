export type Visibility = "open" | "restricted";

export type Section = {
  id: string;
  name: string;
  type: "game" | "video";
  properties: any;
};

export type Classroom = {
  id: string;
  name: string;
  startTime: Date;
  duration: number; // in minutes
  status: "active" | "inactive";
  sections: string[];
  visibility: Visibility;
  maxUsers: number;
};

export type UserSessionStatus = {
  id: string;
};

export type Session = {
  id: string;
  status: "active" | "ended";
  users: UserSessionStatus[];
  maxUsers: number;
  visibility: Visibility;
  classroomId: string;
};
