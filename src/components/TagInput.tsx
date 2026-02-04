import { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { blogApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

const MAX_TAGS = 5;

export function TagInput({ value, onChange, placeholder = 'Type to search or create tags (press Enter, comma, or space)', maxTags = MAX_TAGS }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchTags = async () => {
      if (inputValue.trim().length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const response = await blogApi.searchTags(inputValue);
      if (response.data) {
        const filtered = response.data.filter((tag) => !value.includes(tag));
        setSuggestions(filtered);
        // Always show dropdown when there's input (for existing tags or create new)
        if (document.activeElement === inputRef.current) {
          setShowSuggestions(true);
        }
      } else {
        // Even if API fails, show the create new tag option
        setSuggestions([]);
        if (document.activeElement === inputRef.current) {
          setShowSuggestions(true);
        }
      }
    };

    const debounce = setTimeout(searchTags, 200);
    return () => clearTimeout(debounce);
  }, [inputValue, value]);

  const addTag = (tag: string) => {
    if (value.length >= maxTags) {
      return;
    }
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !value.includes(normalizedTag)) {
      onChange([...value, normalizedTag]);
    }
    setInputValue('');
    setSuggestions([]);
    setSelectedIndex(-1);
    setShowSuggestions(false);
    // Use setTimeout to ensure focus happens after state updates
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      if (value.length >= maxTags) {
        return;
      }
      // If a suggestion is selected, use it
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        addTag(suggestions[selectedIndex]);
      } 
      // If user selected "Create new tag" option (last item when no exact match)
      else if (selectedIndex === suggestions.length && inputValue.trim()) {
        addTag(inputValue);
      }
      // Otherwise, create a new tag from input
      else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Include the "Create new tag" option in navigation
      const maxIndex = inputValue.trim() && !suggestions.includes(inputValue.trim().toLowerCase()) 
        ? suggestions.length 
        : suggestions.length - 1;
      setSelectedIndex((prev) => Math.min(prev + 1, maxIndex));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-2 rounded-md border border-input bg-background p-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            // Show suggestions when user starts typing
            if (e.target.value.trim().length > 0) {
              setShowSuggestions(true);
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            // Show suggestions when input is focused and there's text
            if (inputValue.trim().length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={(e) => {
            // Only hide suggestions if clicking outside the component
            // Check if the related target is not within the suggestions dropdown
            const relatedTarget = e.relatedTarget as HTMLElement;
            if (!containerRef.current?.contains(relatedTarget)) {
              setTimeout(() => setShowSuggestions(false), 200);
            }
          }}
          placeholder={value.length === 0 ? placeholder : value.length >= maxTags ? `Maximum ${maxTags} tags reached` : ''}
          disabled={value.length >= maxTags}
          className="flex-1 min-w-[120px] border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {showSuggestions && inputValue.trim() && value.length < maxTags && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
          <ul className="py-1">
            {/* Show existing tag suggestions */}
            {suggestions.map((tag, index) => (
              <li
                key={tag}
                onMouseDown={(e) => {
                  // Prevent blur event from firing before click
                  e.preventDefault();
                }}
                onClick={() => {
                  addTag(tag);
                }}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm transition-colors',
                  index === selectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {tag}
              </li>
            ))}
            
            {/* Show "Create new tag" option if input doesn't match any suggestion */}
            {inputValue.trim() && !suggestions.includes(inputValue.trim().toLowerCase()) && !value.includes(inputValue.trim().toLowerCase()) && (
              <>
                {suggestions.length > 0 && (
                  <li className="border-t border-border my-1" />
                )}
                <li
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => {
                    addTag(inputValue);
                  }}
                  className={cn(
                    'cursor-pointer px-3 py-2 text-sm transition-colors flex items-center gap-2',
                    selectedIndex === suggestions.length
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Plus className="h-3 w-3" />
                  <span>
                    Create new tag: <strong>{inputValue.trim().toLowerCase()}</strong>
                  </span>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
