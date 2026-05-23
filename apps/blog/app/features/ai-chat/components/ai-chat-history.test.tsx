import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AiChatHistory } from './ai-chat-history';
import { ChatTaskQuery } from '../utils';

vi.mock('@zcat/ui', () => ({
  ZButton: ({ children, onClick, variant, size, className }: any) => (
    <button className={className} onClick={onClick} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(' '),
  useMemoizedFn: (fn: any) => fn,
}));

vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon" />,
  Loader2: () => <span data-testid="loader-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
}));

vi.mock('date-fns', () => ({
  format: () => '2026-01-15 14:30',
}));

vi.mock('../utils', () => ({
  ChatTaskQuery: {
    findTask: vi.fn(),
  },
}));

describe('AiChatHistory', () => {
  const histories = [
    { id: '1', title: 'Chat 1', model: 'deepseek', deepThinking: false, createdAt: 100, updatedAt: 100 },
    { id: '2', title: 'Chat 2', model: 'deepseek', deepThinking: false, createdAt: 200, updatedAt: 200 },
  ];

  it('renders new chat button', () => {
    render(
      <AiChatHistory
        histories={[]}
        conversationId=""
        onSelect={() => {}}
        onDelete={() => {}}
        onNewChat={() => {}}
      />,
    );
    expect(screen.getByText('新对话')).toBeInTheDocument();
  });

  it('renders empty state when no histories', () => {
    render(
      <AiChatHistory
        histories={[]}
        conversationId=""
        onSelect={() => {}}
        onDelete={() => {}}
        onNewChat={() => {}}
      />,
    );
    expect(screen.getByText('暂无历史记录')).toBeInTheDocument();
  });

  it('renders history list', () => {
    vi.mocked(ChatTaskQuery.findTask).mockReturnValue(undefined);

    render(
      <AiChatHistory
        histories={histories}
        conversationId=""
        onSelect={() => {}}
        onDelete={() => {}}
        onNewChat={() => {}}
      />,
    );
    expect(screen.getByText('Chat 1')).toBeInTheDocument();
    expect(screen.getByText('Chat 2')).toBeInTheDocument();
  });
});
