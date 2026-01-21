import { Send, Square } from 'lucide-react';
import * as React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../shadcn/ui/tooltip';
import { ZButton } from '../z-button/z-button';
import { ZTextarea } from '../z-textarea/z-textarea';
import { ZView } from '../z-view/z-view';

interface MessageInputProps {
  onSend: (content: string) => void;
  onAbort: () => void;
  loading?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  onAbort,
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

  const handleAction = () => {
    if (loading) {
      onAbort();
    } else {
      handleSend();
    }
  };

  return (
    <ZView className="w-xl flex flex-col my-4 p-2 gap-2 border rounded-lg bg-white shadow-md">
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
      <ZView className="flex justify-between gap-2 self-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <ZButton
              onClick={handleAction}
              size="icon"
              className="shrink-0"
              aria-label={loading ? '停止' : '发送'}
            >
              {loading ? (
                <Square className="w-4 h-4" fill="currentColor" stroke="none" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </ZButton>
          </TooltipTrigger>
          <TooltipContent side="top" align="center" sideOffset={6}>
            {loading ? '停止' : '发送'}
          </TooltipContent>
        </Tooltip>
      </ZView>
    </ZView>
  );
}
