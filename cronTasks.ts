import { connect } from "http2";
import { ClassroomService } from "./services/classroomService.js";
import { SessionService } from "./services/sessionService.js";
import { ConnectionManager } from "./websocket/services/connectionManager.js";
import { UserScoreService } from "./services/userScoreService.js";

export async function endSession(sessionId: string) {
    ConnectionManager.getInstance().clearSession(sessionId);
    await SessionService.endSession(sessionId)
}

export async function persistUsersAndScoresData(sessionId: string, sectionId: string) {
    const userScoresData = ConnectionManager.getInstance().getSessionSectionScore(sessionId, sectionId); 
    const users = ConnectionManager.getInstance().getAllSessionUsers(sessionId);
    const sectionUserScoreData = new Map()
    sectionUserScoreData.set(sectionId, userScoresData)
    await UserScoreService.writeBulkUserScoreForSession(sessionId, sectionUserScoreData);   
    await SessionService.updateSessionUsers(sessionId, users)
}

export async function archiveSessionData() {
    await SessionService.archiveSessions()
    await UserScoreService.archiveUserScores()
}