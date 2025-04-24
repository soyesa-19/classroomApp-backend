import { Timestamp } from "firebase-admin/firestore";

export type Visibility = "open" | "restricted";

export type Section = {
  id: string;
  name: string;
  type: "game" | "video";
  properties: any;
  durationInMinutes: number;
};

export type Classroom = {
  id: string;
  name: string;
  startTime: Timestamp;
  durationInMinutes: number; // in minutes
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

export type Booking = {
  id: string;
  classroomId: string;
  userCount: number; 
}
