export interface UserProfile {
  dateOfBirth: string;
}

export interface AuthAccount {
  id: string;
  username: string;
  email: string;
  dateOfBirth: string | null;
  profileComplete: boolean | null;
  avatarUrl: string | null;
  fullName: string | null;
  mobileNumber: string | null;
  createdAt: string | null;
}

export interface RegistrationInput {
  username: string;
  email: string;
  password: string;
  avatar: File | null;
}

export type RegistrationResult = { status: "authenticated"; account: AuthAccount } | { status: "signed-up" };

export interface ProfileInput {
  fullName: string;
  mobileNumber: string;
  dateOfBirth: string;
  avatar?: File | null;
}

export interface ApiUser {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  fullName: string | null;
  mobileNumber: string | null;
  dateOfBirth: string | null;
  profileComplete: boolean;
  createdAt?: string | null;
}
