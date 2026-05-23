import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@zcat/ui', () => ({ ZView: ({ children }: any) => <div>{children}</div> }));
vi.mock('@blog/features', () => ({
  AiChat: () => <div data-testid="ai-chat" />,
  AiChatHistory: () => <div />,
  useAiChatManager: () => ({}),
}));

import AiChatPage from './ai-chat.page';

describe('AiChatPage', () => {
  it('renders the AI chat component', () => {
    render(<AiChatPage />);
    expect(screen.getByTestId('ai-chat')).toBeInTheDocument();
  });
});
