export interface DomainEvent<T = any> {
  id: string;
  type: string;
  aggregateId: string;
  timestamp: Date;
  payload: T;
  source: string;
  version: number;
}

export abstract class BaseDomainEvent<T = any> implements DomainEvent<T> {
  readonly id: string;
  readonly timestamp: Date;
  readonly version: number = 1;

  constructor(
    public readonly type: string,
    public readonly aggregateId: string,
    public readonly payload: T,
    public readonly source: string,
  ) {
    this.id = this.generateId();
    this.timestamp = new Date();
  }

  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
