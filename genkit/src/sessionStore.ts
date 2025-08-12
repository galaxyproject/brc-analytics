import fs from "fs";
import path from "path";
import { Session } from "./types";

/**
 * FileSessionStore manages chat sessions using the filesystem
 */
export class FileSessionStore {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    // Ensure the directory exists
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
  }

  /**
   * Get a session by ID
   * @param sessionId - The unique identifier of the session to retrieve
   * @returns A Promise resolving to the Session object if found, or null if not found
   */
  async get(sessionId: string): Promise<Session | null> {
    const sessionPath = path.join(this.baseDir, `${sessionId}.json`);

    try {
      if (fs.existsSync(sessionPath)) {
        const data = fs.readFileSync(sessionPath, "utf8");
        return JSON.parse(data) as Session;
      }
    } catch (error) {
      console.error(`Error reading session ${sessionId}:`, error);
    }

    return null;
  }

  /**
   * Create a new session or update an existing one
   * @param sessionId - The unique identifier of the session to save
   * @param session - The session object to save
   * @returns A Promise that resolves when the session is saved
   */
  async save(sessionId: string, session: Session): Promise<void> {
    const sessionPath = path.join(this.baseDir, `${sessionId}.json`);

    try {
      // Update the timestamp
      session.updatedAt = Date.now();

      // Write the session to disk
      fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
    } catch (error) {
      console.error(`Error saving session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new session
   * @param sessionId - The unique identifier for the new session
   * @returns A Promise resolving to the newly created Session object
   */
  async create(sessionId: string): Promise<Session> {
    const now = Date.now();
    const session: Session = {
      createdAt: now,
      id: sessionId,
      messages: [],
      updatedAt: now,
    };

    await this.save(sessionId, session);
    return session;
  }

  /**
   * Delete a session
   * @param sessionId - The unique identifier of the session to delete
   * @returns A Promise resolving to true if the session was deleted, false otherwise
   */
  async delete(sessionId: string): Promise<boolean> {
    const sessionPath = path.join(this.baseDir, `${sessionId}.json`);

    try {
      if (fs.existsSync(sessionPath)) {
        fs.unlinkSync(sessionPath);
        return true;
      }
    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error);
    }

    return false;
  }

  /**
   * List all sessions
   * @returns A Promise resolving to an array of session IDs
   */
  async list(): Promise<string[]> {
    try {
      const files = fs.readdirSync(this.baseDir);
      return files
        .filter((file) => file.endsWith(".json"))
        .map((file) => file.replace(".json", ""));
    } catch (error) {
      console.error("Error listing sessions:", error);
      return [];
    }
  }
}
