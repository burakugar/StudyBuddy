import { AvailabilitySlotDto } from './availability.model'; // Import new model
import { CourseDto } from './course.models';
import { InterestDto } from './interest.models';

export interface User {
  id: number;
  email: string;
  fullName: string;
}

export interface UserProfileDto {
  id: number;
  email: string;
  fullName: string;
  academicYear?: string;
  profilePictureUrl?: string;
  major?: string;
  university?: string;
  bio?: string;
  studyStyle?: string;
  preferredEnvironment?: string;
  latitude?: number | null; 
  longitude?: number | null; 
  courses: CourseDto[];
  interests: InterestDto[];
  availabilitySlots: AvailabilitySlotDto[]; 
}

export interface UserUpdateDto {
  fullName?: string;
  academicYear?: string | null; 
  major?: string | null;
  university?: string | null;
  bio?: string | null;
  studyStyle?: string | null;
  preferredEnvironment?: string | null;
  profilePictureUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  courseCodes?: string[];
  interestNames?: string[];
  availabilitySlots?: AvailabilitySlotDto[]; 
}

export interface PublicProfileDto {
  id: number;
  fullName: string;
  academicYear?: string;
  major?: string;
  university?: string;
  profilePictureUrl?: string;
  bio?: string;
  studyStyle?: string;
  preferredEnvironment?: string;
}

export interface NearbyUserDto {
  userId: number;
  fullName: string;
  profilePictureUrl: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
}
