import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('EventCenter', () => {
  let EventCenter: typeof import('./event-center').EventCenter;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('./event-center');
    EventCenter = mod.EventCenter;
  });

  it('应该注册并触发事件', () => {
    const callback = vi.fn();
    EventCenter.subscribe('ERROR', callback);
    EventCenter.emitEvent('ERROR', new Error('test'));
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(new Error('test'));
  });

  it('应该支持多个监听器', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    EventCenter.subscribe('ERROR', cb1);
    EventCenter.subscribe('ERROR', cb2);
    EventCenter.emitEvent('ERROR', new Error('err'));

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe 应该移除监听器', () => {
    const callback = vi.fn();
    const unsubscribe = EventCenter.subscribe('ERROR', callback);
    unsubscribe();
    EventCenter.emitEvent('ERROR', new Error('test'));
    expect(callback).not.toHaveBeenCalled();
  });

  it('不同监听器应该彼此独立', () => {
    const removedCallback = vi.fn();
    const activeCallback = vi.fn();

    const unsubscribe = EventCenter.subscribe('ERROR', removedCallback);
    EventCenter.subscribe('ERROR', activeCallback);
    unsubscribe();
    EventCenter.emitEvent('ERROR', new Error('error'));

    expect(removedCallback).not.toHaveBeenCalled();
    expect(activeCallback).toHaveBeenCalledTimes(1);
  });

  it('emitEvent 应该给所有监听器传递相同参数', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    EventCenter.subscribe('ERROR', cb1);
    EventCenter.subscribe('ERROR', cb2);
    EventCenter.emitEvent('ERROR', new Error('shared'));

    expect(cb1).toHaveBeenCalledWith(new Error('shared'));
    expect(cb2).toHaveBeenCalledWith(new Error('shared'));
  });

  it('unsubscribe 多次调用不应报错', () => {
    const callback = vi.fn();
    const unsubscribe = EventCenter.subscribe('ERROR', callback);
    unsubscribe();
    unsubscribe();
    EventCenter.emitEvent('ERROR', new Error('test'));
    expect(callback).not.toHaveBeenCalled();
  });
});
