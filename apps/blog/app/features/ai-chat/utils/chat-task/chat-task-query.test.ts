import { describe, expect, it } from 'vitest';

import { ChatTaskQuery } from './chat-task-query';
import { ChatTask } from './chat-task';

describe('ChatTaskQuery', () => {
  it('getTask returns the same task for a conversationId', () => {
    const task1 = ChatTaskQuery.getTask('conv-1');
    const task2 = ChatTaskQuery.getTask('conv-1');
    expect(task1).toBe(task2);
  });

  it('getTask creates different tasks for different IDs', () => {
    const task1 = ChatTaskQuery.getTask('conv-a');
    const task2 = ChatTaskQuery.getTask('conv-b');
    expect(task1).not.toBe(task2);
  });

  it('findTask returns undefined for unknown ID', () => {
    expect(ChatTaskQuery.findTask('unknown')).toBeUndefined();
  });

  it('findTask returns the task after getTask was called', () => {
    const task = ChatTaskQuery.getTask('conv-find');
    expect(ChatTaskQuery.findTask('conv-find')).toBe(task);
  });
});
