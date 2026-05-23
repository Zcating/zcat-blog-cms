import { describe, expect, it } from 'vitest';

import { ChatTask } from './chat-task';

describe('ChatTask', () => {
  it('starts with empty content and not finished', () => {
    const task = new ChatTask();
    let captured: any;
    task.addListener((event) => {
      captured = event;
    });
    expect(captured.content).toBe('');
    expect(captured.isFinish).toBe(false);
  });

  it('appends content and notifies listeners', () => {
    const task = new ChatTask();
    const results: string[] = [];
    task.addListener((event) => results.push(event.content));

    task.append('Hello');
    expect(results).toEqual(['', 'Hello']);
  });

  it('finish sets isFinish to true', () => {
    const task = new ChatTask();
    let finished = false;
    task.addListener((event) => {
      finished = event.isFinish;
    });

    task.finish();
    expect(finished).toBe(true);
  });

  it('fail sets isFinish and overrides content', () => {
    const task = new ChatTask();
    task.append('partial');
    task.fail('error message');

    let state: any;
    task.addListener((e) => {
      state = e;
    });
    expect(state.content).toBe('error message');
    expect(state.isFinish).toBe(true);
  });

  it('reset clears finish state and sets content', () => {
    const task = new ChatTask();
    task.finish();
    task.reset('restart');
    let state: any;
    task.addListener((e) => {
      state = e;
    });
    expect(state.content).toBe('restart');
    expect(state.isFinish).toBe(false);
  });

  it('removeListener stops receiving events', () => {
    const task = new ChatTask();
    let count = 0;
    const teardown = task.addListener(() => count++);
    task.append('a');
    teardown();
    task.append('b');
    expect(count).toBe(2);
  });
});
