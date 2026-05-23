import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AiChat } from './ai-chat';

vi.mock('@zcat/ui', () => ({
  ZView: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  ZChat: ({ placeholder, toolbar }: any) => <div>{placeholder}{toolbar}</div>,
  ZSelect: () => <div data-testid="model-select" />,
  Toggle: ({ children }: any) => <div>{children}</div>,
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(' '),
  useMemoizedFn: (fn: any) => fn,
}));

vi.mock('lucide-react', () => ({
  AtomIcon: () => <span data-testid="atom-icon" />,
}));

vi.mock('../hooks/use-ai-chat-manager', () => ({
  useAiChatManager: () => ({
    controller: { add: vi.fn(), json: vi.fn(() => []), set: vi.fn(), clear: vi.fn(), pop: vi.fn(), lastMessage: null },
    histories: [],
    conversationId: '',
    loading: false,
    model: 'deepseek' as const,
    setModel: vi.fn(),
    deepThinking: false,
    setDeepThinking: vi.fn(),
    send: vi.fn(),
    regenerate: vi.fn(),
    abort: vi.fn(),
    selectConversation: vi.fn(),
    deleteConversation: vi.fn(),
    newConversation: vi.fn(),
  }),
}));

vi.mock('./ai-chat-history', () => ({
  AiChatHistory: () => <div data-testid="ai-chat-history" />,
}));

vi.mock('./api-key-promption', () => ({
  apiKeyPromption: vi.fn(),
}));

describe('AiChat', () => {
  it('renders placeholder and toolbars', () => {
    render(<AiChat />);
    expect(screen.getByText('问问AI...')).toBeInTheDocument();
  });

  it('renders model select and deep thinking toggle', () => {
    render(<AiChat />);
    expect(screen.getByText('深度思考')).toBeInTheDocument();
  });
});
