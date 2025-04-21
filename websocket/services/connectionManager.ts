import { Socket } from "socket.io";
import { SessionSectionUserScore } from "../../types/userScores.js";

interface UserConnection {
  socket: Socket;
  activeSession?: string;
}

export class ConnectionManager {
  private static instance: ConnectionManager;
  private connections: Map<string, UserConnection>;
  private sessions: Map<string, Map<string, boolean>>; // sessionId -> userId -> connected to session
  private sessionScores: Map<string, Map<string, Map<string, number>>>; // sessionId -> sectionId -> userId -> score
  private bookedSession: Map<string, { sessionId: string, users: Set<string>, openSlots: number }>;

  private constructor() {
    this.connections = new Map();
    this.sessions = new Map();
    this.sessionScores = new Map();
    this.bookedSession = new Map();
  }

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  public getConnection(userId: string) {
    return this.connections.get(userId)
  }

  // Add a new connection
  public addConnection(socket: Socket): void {
    const connection: UserConnection = {
      socket,
    };
    this.connections.set(socket.data.user.id, connection);
  }

  // Remove a connection
  public removeConnection(userId: string): void {
    const connection = this.connections.get(userId);
    if (connection) {
      this.connections.delete(userId);
    }
  }

  public getActiveSessionUsers(sessionId: string) {
    return Array.from(this.sessions.get(sessionId)?.entries() || [])
      .filter(([_, status]) => status)
      .map(([userId]) => userId);
  }

  public getAllSessionUsers(sessionId: string) {
    return Array.from(this.sessions.get(sessionId)?.entries() || [])
      .map(([userId]) => userId);
  }

  public updateUserSessionStatus(
    sessionId: string,
    userId: string,
    status: boolean
  ) {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = new Map();
    }

    session.set(userId, status);
    this.sessions.set(sessionId, session);

    const connection = this.connections.get(userId);
    if (connection) {
      connection.activeSession = status ? sessionId : undefined;
    }
  }

  public getSessionScore(sessionId: string) {
    return this.sessionScores.get(sessionId);
  }

  public getSessionSectionScore(sessionId: string, sectionId: string) {
    return this.sessionScores.get(sessionId)?.get(sectionId);
  }

  // Update user's score
  public updateSessionScore(
    scoreData: Omit<SessionSectionUserScore, "id">
  ): void {
    let sessionScore = this.sessionScores.get(scoreData.sessionId);
    if (!sessionScore) {
      sessionScore = new Map();
      this.sessionScores.set(scoreData.sessionId, sessionScore);
    }

    let sectionScore = sessionScore.get(scoreData.sectionId);
    if (!sectionScore) {
      sectionScore = new Map();
      sessionScore.set(scoreData.sessionId, sectionScore);
    }

    let userScore = sectionScore.get(scoreData.userId);
    if (!userScore) {
      userScore = scoreData.score;
      sectionScore.set(scoreData.sessionId, userScore);
    }
  }

  public addBooking(bookingId: string, bookingRecord: { sessionId: string, openSlots: number; }) {
    this.bookedSession.set(bookingId, { users: new Set(), ...this.getBooking(bookingId), ...bookingRecord });
  }

  public addUserToBooking(bookingId: string, userId: string) {
    const existingBooking = this.getBooking(bookingId);
    if (!existingBooking) {
      throw new Error('Invalid operation, booking not initialized')
    }
    existingBooking.users.add(userId)
  }

  public decrementOpenBookingSlots(bookingId: string) {
    const existingBooking = this.getBooking(bookingId);
    if (!existingBooking) {
      throw new Error('Invalid operation, booking not initialized')
    }
    if (existingBooking.openSlots <= 0) {
      throw new Error("Invalid operation, no open slots available")
    }
    existingBooking.openSlots -= 1

    return existingBooking.openSlots;
  }

  public incrementOpenBookingSlots(bookingId: string) {
    const existingBooking = this.getBooking(bookingId);
    if (!existingBooking) {
      throw new Error('Invalid operation, booking not initialized')
    }

    existingBooking.openSlots += 1

    return existingBooking.openSlots;
  }

  public getBooking(bookingId: string) {
    return this.bookedSession.get(bookingId);
  }

  public getBookingBySessionId(sessionId: string) {
    return Array.from(this.bookedSession.entries()).filter(([_, record]) => {
      return record.sessionId === sessionId
    })[0]
  }

  // Get connection statistics
  public getConnectionStats(): {
    totalConnections: number;
    activeSessions: number;
    totalUsers: number;
  } {
    return {
      totalConnections: this.connections.size,
      activeSessions: this.sessions.size,
      totalUsers: new Set(
        Array.from(this.connections.values()).map((c) => c.socket.data.user.id)
      ).size,
    };
  }

  public clearSession(sessionId: string) {
    const users = this.sessions.get(sessionId);
    Array.from(users?.entries() || []).forEach(([userId]) => {
      const connection = this.connections.get(userId);
      if (connection) {
        if (connection.socket.connected) {
          connection.socket.disconnect(true);
        }
        this.connections.delete(userId);
      }
    });
    this.sessionScores.delete(sessionId);
    this.sessions.delete(sessionId);
  }
}
