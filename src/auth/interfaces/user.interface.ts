export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPayload {
  /** Subject — user id */
  sub: string;
  email: string;
  name: string;
}

/** User object returned to clients — password is always stripped */
export type SafeUser = Omit<User, 'password'>;

/** Access + refresh token pair returned by login / refresh endpoints */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
}
