import { Send, Loader2 } from 'lucide-react';
import * as React from 'react';

import { ZButton } from '../z-button/z-button';
import { ZTextarea } from '../z-textarea/z-textarea';
import { ZView } from '../z-view/z-view';

interface MessageInputProps {
  onSend: (content: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  loading,
  placeholder,
}: MessageInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (inputValue.trim() && !loading) {
      onSend(inputValue);
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
    <ZView className="flex flex-col p-4 gap-2 items-end border rounded-lg bg-white shadow-md">
      <ZTextarea
        ref={textareaRef}
        value={inputValue}
        onValueChange={setInputValue}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={loading}
        className="flex-1 min-h-[40px] resize-none border-0 shadow-none focus-visible:ring-0"
        rows={1}
      />
      <ZView className="flex justify-between gap-2">
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
    </ZView>
  );
}
