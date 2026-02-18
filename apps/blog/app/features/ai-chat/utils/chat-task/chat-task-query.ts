import { ChatTask } from './chat-task';

export namespace ChatTaskQuery {
  const conversationTasks = new Map<string, ChatTask>();

  export function getTask(conversationId: string) {
    let task = conversationTasks.get(conversationId);
    if (!task) {
      task = new ChatTask();
      conversationTasks.set(conversationId, task);
    }
    return task;
  }

  export function findTask(conversationId: string) {
    return conversationTasks.get(conversationId);
  }
}
