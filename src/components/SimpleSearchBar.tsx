import { useState, useRef, useEffect } from "react";
import { Search, X, Sparkles, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SimpleSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SimpleSearchBar({ 
  value, 
  onChange, 
  placeholder = "What book are you looking for today?" 
}: SimpleSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearSearch = () => {
    onChange('');
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative group">
        {/* Glowing background effect */}
        <div className={`
          absolute -inset-1 bg-gradient-primary rounded-2xl sm:rounded-3xl blur opacity-20 
          transition-opacity duration-300 ${isFocused ? 'opacity-40' : 'opacity-20'}
        `}></div>
        
        {/* Main search container */}
        <div className={`
          relative flex items-center bg-card/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl 
          border-2 transition-all duration-500 overflow-hidden
          ${isFocused 
            ? 'border-primary/40 shadow-2xl shadow-primary/20' 
            : 'border-border/30 shadow-apple-lg hover:border-border/50'
          }
        `}>
          
          {/* Search icon with animation */}
          <div className="pl-6 pr-4">
            <div className={`
              relative transition-all duration-300 
              ${isFocused ? 'scale-110' : 'scale-100'}
            `}>
              <Search className={`
                w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-300
                ${isFocused ? 'text-primary' : 'text-muted-foreground'}
              `} />
              {isFocused && (
                <div className="absolute inset-0 w-5 h-5 sm:w-6 sm:h-6 bg-primary/20 rounded-full animate-ping"></div>
              )}
            </div>
          </div>
          
          {/* Input field */}
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="
              flex-1 border-0 bg-transparent text-base sm:text-lg lg:text-xl 
              py-6 sm:py-8 px-0 focus-visible:ring-0 
              placeholder:text-muted-foreground/70 placeholder:font-medium
              transition-all duration-300
            "
          />
          
          {/* Clear button with smooth animation */}
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="
                mr-4 h-8 w-8 sm:h-10 sm:w-10 p-0 rounded-full
                bg-secondary/50 hover:bg-secondary/80 
                transition-all duration-300 hover:scale-110
                group-hover:bg-secondary/60
              "
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
            </Button>
          )}

          {/* AI-powered suggestion indicator */}
          {isFocused && !value && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm text-muted-foreground/60 animate-fade-in">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="hidden sm:inline font-medium">AI-powered search</span>
            </div>
          )}
        </div>

        {/* Search hint */}
        {!isFocused && !value && (
          <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-sm text-muted-foreground/50 hidden lg:flex">
            <BookOpen className="w-4 h-4" />
            <span>Press</span>
            <kbd className="px-3 py-1.5 bg-secondary/60 rounded-lg text-xs font-medium border border-border/50">/</kbd>
            <span>to search</span>
          </div>
        )}

        {/* Floating particles effect when focused */}
        {isFocused && (
          <>
            <div className="absolute -top-2 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-float hidden lg:block"></div>
            <div className="absolute -bottom-1 right-1/3 w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-float hidden lg:block" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute top-0 right-1/4 w-1 h-1 bg-purple-400/50 rounded-full animate-float hidden lg:block" style={{animationDelay: '1s'}}></div>
          </>
        )}
      </div>

      {/* Search suggestions/recent searches could go here */}
      {value && isFocused && (
        <div className="mt-4 text-center animate-fade-in">
          <p className="text-sm text-muted-foreground">
            🔍 Searching across <strong>{value.length > 0 ? '1,200+' : ''}</strong> books in our collection
          </p>
        </div>
      )}
    </div>
  );
}