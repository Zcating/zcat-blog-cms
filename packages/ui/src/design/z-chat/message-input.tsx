import { Send, Loader2 } from 'lucide-react';
import * as React from 'react';

import { ZButton } from '../z-button/z-button';
import { ZTextarea } from '../z-textarea/z-textarea';
import { ZView } from '../z-view/z-view';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSendMessage,
  loading,
  placeholder,
}: MessageInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (inputValue.trim() && !loading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <ZView className="p-4 border-t bg-muted/30 flex gap-2 items-end">
      <ZTextarea
        ref={textareaRef}
        value={inputValue}
        onValueChange={setInputValue}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={loading}
        className="flex-1 min-h-[40px] resize-none"
        rows={1}
      />
      <ZButton
        onClick={handleSend}
        disabled={loading || !inputValue.trim()}
        size="icon"
        className="shrink-0"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </ZButton>
    </ZView>
  );
}
