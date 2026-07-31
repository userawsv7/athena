// In-memory session store as fallback when database is not available
interface SessionData {
  sessionId: string;
  technology: string;
  mode: string;
  messages: Array<{ role: string; content: string; timestamp: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

class SessionStore {
  private sessions: Map<string, SessionData> = new Map();
  private maxSessions = 100;

  create(sessionId: string, technology: string, mode: string): SessionData {
    const session: SessionData = {
      sessionId,
      technology,
      mode,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sessions.set(sessionId, session);

    // Clean up old sessions if over limit
    if (this.sessions.size > this.maxSessions) {
      const oldestKey = Array.from(this.sessions.keys())[0];
      this.sessions.delete(oldestKey);
    }

    return session;
  }

  get(sessionId: string): SessionData | null {
    return this.sessions.get(sessionId) || null;
  }

  addMessage(sessionId: string, role: string, content: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages.push({
        role,
        content,
        timestamp: new Date(),
      });
      session.updatedAt = new Date();
    }
  }

  getMessages(sessionId: string) {
    const session = this.sessions.get(sessionId);
    return session ? session.messages : [];
  }

  exists(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
}

export const sessionStore = new SessionStore();