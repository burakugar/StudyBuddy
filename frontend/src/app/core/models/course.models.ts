/**
 * Models related to courses
 */

export interface CourseDto {
  id?: number;
  courseCode: string;
  name: string;
  description?: string;
  department?: string;
}

// Empty export to ensure file is recognized as a module
export {};
