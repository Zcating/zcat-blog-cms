import { Loader2Icon, Send } from 'lucide-react';
import * as React from 'react';

import { ZButton } from '../z-button/z-button';
import { ZTextarea } from '../z-textarea/z-textarea';
import { ZView } from '../z-view/z-view';

import { useShortcut } from './use-shortcut';

interface MessageInputProps {
  onSend: (content: string) => void;
  onAbort: () => void;
  loading?: boolean;
  placeholder?: string;
  toolbar?: React.ReactNode;
}

export function MessageInput({
  onSend,
  onAbort,
  loading,
  placeholder,
  toolbar,
}: MessageInputProps) {
  const [inputValue, setInputValue] = React.useState('');

  const shortcut = useShortcut();

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

  const handleAction = () => {
    if (loading) {
      onAbort();
    } else {
      handleSend();
    }
  };

  return (
    <ZView className="w-xs md:w-md lg:w-2xl flex flex-col my-4 p-2 gap-2 border rounded-lg bg-white shadow-md">
      <ZTextarea
        value={inputValue}
        onValueChange={setInputValue}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={loading}
        className="flex-1 min-h-10 max-h-20 resize-none border-0 shadow-none focus-visible:ring-0 z-scrollbar"
        rows={1}
      />
      <ZView className="flex items-center gap-4 justify-between">
        {toolbar ? <ZView className="shrink-0">{toolbar}</ZView> : null}
        <ZView className="flex items-center gap-4 self-end">
          <ZView className="text-sm font-bold text-muted-foreground">
            {shortcut}
          </ZView>
          <ZButton
            onClick={handleAction}
            size="icon"
            className="shrink-0"
            aria-label={loading ? '停止' : '发送'}
            tooltip={loading ? '停止' : '发送'}
          >
            {loading ? (
              <Loader2Icon className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </ZButton>
        </ZView>
      </ZView>
    </ZView>
  );
}
