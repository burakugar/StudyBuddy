export interface StudySessionDto {
id: number;
title: string;
description?: string;
startTime: Date;
endTime?: Date;
location: string;
creatorId: number;
creatorName: string;
courseCode?: string;
participantIds: number[];
participantCount: number;
}

export interface CreateStudySessionDto {
title: string;
description?: string;
startTime: string;
endTime?: string;
location: string;
courseCode?: string;
}

export interface UpdateStudySessionDto {
title?: string;
description?: string;
startTime?: string;
endTime?: string;
location?: string;
courseCode?: string;
}