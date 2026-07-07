export interface DigitalLife {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  status: DigitalLifeStatus;
  birthTime: Date;
  lastActiveTime: Date;
  totalInteractionCount: number;
  totalMemoryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum DigitalLifeStatus {
  ACTIVE = 'active',
  DORMANT = 'dormant',
  ARCHIVED = 'archived',
}
