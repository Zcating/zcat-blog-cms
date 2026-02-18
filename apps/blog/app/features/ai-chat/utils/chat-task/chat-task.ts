export interface ChatEvent {
  content: string;
  isFinish: boolean;
}

export class ChatTask {
  private listeners: ((event: ChatEvent) => void)[] = [];
  private state: ChatEvent = {
    content: '',
    isFinish: false,
  };

  constructor() {
    this.addListener = this.addListener.bind(this);
    this.append = this.append.bind(this);
    this.reset = this.reset.bind(this);
    this.finish = this.finish.bind(this);
    this.fail = this.fail.bind(this);
  }

  addListener(callback: (event: ChatEvent) => void): Teardown {
    this.listeners.push(callback);
    callback(this.state);

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  append(content: string) {
    this.state.content += content;
    this.listeners.forEach((listener) => listener(this.state));
  }

  reset(content: string) {
    this.state.isFinish = false;
    this.state.content = content;
    this.listeners.forEach((listener) => listener(this.state));
  }

  finish() {
    this.state.isFinish = true;
    this.listeners.forEach((listener) => listener(this.state));
  }

  fail(content: string) {
    this.state.isFinish = true;
    this.state.content = content;
    this.listeners.forEach((listener) => listener(this.state));
  }
}
