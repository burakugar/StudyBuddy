/**
 * Models related to the matching feature
 */

export interface MatchCardDto {
  id: number;
  userId: number; // Added this field
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
  commonCourses?: any[]; // Added for the quick match component
  commonInterests?: any[]; // Added for the quick match component
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

// Empty export to ensure file is recognized as a module
export {};
