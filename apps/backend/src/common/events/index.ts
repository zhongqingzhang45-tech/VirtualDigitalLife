import { BaseDomainEvent } from './domain-event.base';

// 数字生命相关事件
export class DigitalLifeCreatedEvent extends BaseDomainEvent<{
  userId: string;
  name: string;
}> {
  constructor(aggregateId: string, payload: { userId: string; name: string }) {
    super('digital_life.created', aggregateId, payload, 'character');
  }
}

// 用户消息相关事件
export class UserMessageReceivedEvent extends BaseDomainEvent<{
  userId: string;
  message: string;
  messageId: string;
}> {
  constructor(aggregateId: string, payload: { userId: string; message: string; messageId: string }) {
    super('user_message.received', aggregateId, payload, 'presentation');
  }
}

// 记忆相关事件
export class MemoryCreatedEvent extends BaseDomainEvent<{
  memoryId: string;
  type: string;
  importance: number;
  emotionTags: string[];
}> {
  constructor(aggregateId: string, payload: { memoryId: string; type: string; importance: number; emotionTags: string[] }) {
    super('memory.created', aggregateId, payload, 'memory');
  }
}

// 情绪相关事件
export class EmotionChangedEvent extends BaseDomainEvent<{
  previous: Record<string, number>;
  current: Record<string, number>;
  trigger: string;
}> {
  constructor(aggregateId: string, payload: { previous: Record<string, number>; current: Record<string, number>; trigger: string }) {
    super('emotion.changed', aggregateId, payload, 'emotion');
  }
}

// 生命状态相关事件
export class LifeStateUpdatedEvent extends BaseDomainEvent<{
  state: string;
}> {
  constructor(aggregateId: string, payload: { state: string }) {
    super('life_state.updated', aggregateId, payload, 'life-engine');
  }
}
