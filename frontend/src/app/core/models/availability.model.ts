
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface AvailabilitySlotDto {
  id?: number; 
  dayOfWeek: DayOfWeek;
  startTime: string; 
  endTime: string;   
}
