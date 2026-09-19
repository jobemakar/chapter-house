import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type Unsubscribe,
} from "firebase/auth";
import { chapterHouseFirebase } from "./config";
import {
  InvalidUsernameError,
  normalizeUsername,
  usernameFromInternalEmail,
  usernameToInternalEmail,
} from "./username";

export type MemberSessionState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "member"; uid: string; username: string };

export class MemberLoginError extends Error {
  constructor(
    message = "That username and password did not match. Check them and try again.",
  ) {
    super(message);
    this.name = "MemberLoginError";
  }
}

export class FirebaseSession {
  private readonly auth: Auth;
  private readonly listeners = new Set<(state: MemberSessionState) => void>();
  private readonly persistenceReady: Promise<void>;
  private readonly stopAuthListener: Unsubscribe;
  private current: MemberSessionState = { status: "loading" };

  constructor() {
    this.auth = getAuth(chapterHouseFirebase());
    this.persistenceReady = setPersistence(
      this.auth,
      browserLocalPersistence,
    ).catch(() => undefined);
    this.stopAuthListener = onAuthStateChanged(this.auth, (user) => {
      if (!user) {
        this.publish({ status: "guest" });
        return;
      }
      const username =
        usernameFromInternalEmail(user.email) ??
        (user.displayName ? normalizeUsername(user.displayName) : null);
      this.publish(
        username
          ? { status: "member", uid: user.uid, username }
          : { status: "guest" },
      );
    });
  }

  get state(): MemberSessionState {
    return this.current;
  }

  subscribe(listener: (state: MemberSessionState) => void): () => void {
    this.listeners.add(listener);
    listener(this.current);
    return () => this.listeners.delete(listener);
  }

  async signIn(usernameInput: string, password: string): Promise<string> {
    let username: string;
    try {
      username = normalizeUsername(usernameInput);
    } catch (error) {
      if (error instanceof InvalidUsernameError) throw error;
      throw new MemberLoginError();
    }
    if (password.length < 6) throw new MemberLoginError();
    await this.persistenceReady;
    try {
      await signInWithEmailAndPassword(
        this.auth,
        usernameToInternalEmail(username),
        password,
      );
      return username;
    } catch {
      // Do not reveal whether a username exists.
      throw new MemberLoginError();
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  dispose(): void {
    this.stopAuthListener();
    this.listeners.clear();
  }

  private publish(state: MemberSessionState): void {
    this.current = state;
    for (const listener of this.listeners) listener(state);
  }
}
