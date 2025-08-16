import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFollowing } from '@/hooks/useFollowing';
import { cn } from '@/lib/utils';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MentionInput({
  value,
  onChange,
  placeholder = "Type @username or paste npub/hex",
  disabled = false,
  className
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: following = [] } = useFollowing();

  // Extract @mention from input value
  const mentionMatch = value.match(/@(\w*)$/);
  const currentMention = mentionMatch ? mentionMatch[1] : '';

  useEffect(() => {
    if (mentionMatch && currentMention !== searchTerm) {
      setSearchTerm(currentMention);
      setShowSuggestions(true);
    } else if (!mentionMatch) {
      setShowSuggestions(false);
      setSearchTerm('');
    }
  }, [value, currentMention, searchTerm, mentionMatch]);

  // Filter following users based on search term
  const filteredUsers = following.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleSelectUser = (user: { pubkey: string; displayName: string }) => {
    // Replace the @mention with the full pubkey
    const beforeMention = value.substring(0, value.lastIndexOf('@'));
    const newValue = beforeMention + user.pubkey;
    onChange(newValue);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("pr-8", className)}
      />
      
      {showSuggestions && filteredUsers.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg">
          <ScrollArea className="max-h-48">
            <div className="p-1">
              {filteredUsers.slice(0, 8).map((user) => (
                <Button
                  key={user.pubkey}
                  variant="ghost"
                  className="w-full justify-start h-auto p-2 text-left"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="flex items-center space-x-2 w-full">
                    <Avatar className="h-6 w-6">
                      {user.picture && <AvatarImage src={user.picture} alt={user.displayName} />}
                      <AvatarFallback className="text-xs">
                        {user.displayName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{user.displayName}</div>
                      {user.name && user.name !== user.displayName && (
                        <div className="text-xs text-muted-foreground truncate">@{user.name}</div>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {value.startsWith('@') && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="text-xs text-muted-foreground">
            Type to search
          </div>
        </div>
      )}
    </div>
  );
}