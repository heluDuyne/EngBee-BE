import { PracticeStatus } from "../entities/Practice";

export interface CreatePracticeDTO {
  title: string;
  description?: string;
  level: string;
  skillType: string;
  tags?: string[];
  duration?: number;
  content?: string;
  audioUrl?: string;
  questions?: any[];
}

export interface UpdatePracticeDTO {
  title?: string;
  description?: string;
  level?: string;
  skillType?: string;
  tags?: string[];
  duration?: number;
  content?: string;
  audioUrl?: string;
  questions?: any[];
  status?: PracticeStatus;
}

export interface PracticeResponseDTO {
  id: string;
  title: string;
  description?: string;
  level: string;
  skillType: string;
  tags?: string[];
  duration: number;
  content?: string;
  audioUrl?: string;
  questions?: any[];
  status: PracticeStatus;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}
