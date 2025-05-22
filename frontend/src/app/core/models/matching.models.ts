/**
 * Models related to the matching feature
 */

export interface MatchCardDto {
  id: number;
  userId: number;
  fullName: string;
  academicYear?: string;
  major?: string;
  university?: string;
  bio?: string;
  studyStyle?: string;
  preferredEnvironment?: string;
  profilePictureUrl?: string;
  courseCodes?: string[];
  interestNames?: string[];
  commonCourses?: any[]; 
  commonInterests?: any[]; 
  matchPercentage?: number;
}

export interface MatchPreferencesDto {
  academicYear?: string;
  major?: string;
  university?: string;
  studyStyle?: string;
  preferredEnvironment?: string;
  courseCodes?: string[];
  interestNames?: string[];
}

export {};
