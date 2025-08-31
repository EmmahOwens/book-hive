import { useState, useRef, useEffect } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SearchFilters {
  categories: string[];
  levels: string[];
  availability: 'all' | 'available' | 'unavailable';
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFiltersChange: (filters: SearchFilters) => void;
  filters: SearchFilters;
  placeholder?: string;
}

const CATEGORIES = [
  'Mathematics', 'Science', 'Physics', 'Electronics', 'Signal Processing',
  'Electrical Engineering', 'Computer Science', 'AI', 'Education', 'Research',
  'Philosophy', 'Arts', 'History', 'Mechanical Engineering', 'Statistics'
];

const LEVELS = ['Bachelors', 'Masters', 'PhD', 'General'];

export function SearchBar({ 
  value, 
  onChange, 
  onFiltersChange, 
  filters, 
  placeholder = "Search books by title, author, or category..." 
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeFilterCount = filters.categories.length + filters.levels.length + 
    (filters.availability !== 'all' ? 1 : 0);

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked 
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category);
    
    onFiltersChange({
      ...filters,
      categories: newCategories
    });
  };

  const handleLevelChange = (level: string, checked: boolean) => {
    const newLevels = checked 
      ? [...filters.levels, level]
      : filters.levels.filter(l => l !== level);
    
    onFiltersChange({
      ...filters,
      levels: newLevels
    });
  };

  const handleAvailabilityChange = (availability: SearchFilters['availability']) => {
    onFiltersChange({
      ...filters,
      availability
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      categories: [],
      levels: [],
      availability: 'all'
    });
  };

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
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Main Search Input */}
      <div className="relative">
        <div className={`
          flex items-center bg-card/80 backdrop-blur-md rounded-2xl border-2 transition-all duration-300
          ${isFocused 
            ? 'border-primary shadow-glow' 
            : 'border-border/50 shadow-neumorphic'
          }
        `}>
          <div className="pl-6 pr-3">
            <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="flex-1 border-0 bg-transparent text-lg py-6 px-0 focus-visible:ring-0 placeholder:text-muted-foreground"
          />
          
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="mr-2 h-8 w-8 p-0 hover:bg-secondary/80"
            >
              <X className="w-4 h-4" />
            </Button>
          )}

          <div className="pr-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`
                    relative shadow-neumorphic hover:shadow-neumorphic-inset
                    ${activeFilterCount > 0 ? 'bg-primary/10 border-primary/30' : ''}
                  `}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="w-80 bg-card/95 backdrop-blur-md border-border/50 shadow-glass">
                <div className="flex items-center justify-between p-2">
                  <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-auto p-1 text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                
                <DropdownMenuSeparator />
                
                {/* Availability Filter */}
                <div className="p-2">
                  <DropdownMenuLabel className="text-sm font-medium">Availability</DropdownMenuLabel>
                  <div className="space-y-1">
                    {[
                      { value: 'all', label: 'All Books' },
                      { value: 'available', label: 'Available Now' },
                      { value: 'unavailable', label: 'Currently Borrowed' }
                    ].map((option) => (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={filters.availability === option.value}
                        onCheckedChange={() => handleAvailabilityChange(option.value as SearchFilters['availability'])}
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* Level Filter */}
                <div className="p-2">
                  <DropdownMenuLabel className="text-sm font-medium">Academic Level</DropdownMenuLabel>
                  <div className="space-y-1">
                    {LEVELS.map((level) => (
                      <DropdownMenuCheckboxItem
                        key={level}
                        checked={filters.levels.includes(level)}
                        onCheckedChange={(checked) => handleLevelChange(level, checked)}
                      >
                        {level}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* Category Filter */}
                <div className="p-2 max-h-48 overflow-y-auto">
                  <DropdownMenuLabel className="text-sm font-medium">Categories</DropdownMenuLabel>
                  <div className="space-y-1">
                    {CATEGORIES.map((category) => (
                      <DropdownMenuCheckboxItem
                        key={category}
                        checked={filters.categories.includes(category)}
                        onCheckedChange={(checked) => handleCategoryChange(category, checked)}
                      >
                        {category}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search Hint */}
        {!isFocused && !value && (
          <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
            Press <kbd className="px-2 py-1 bg-muted rounded text-xs">/</kbd> to focus
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.availability !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {filters.availability === 'available' ? 'Available Now' : 'Unavailable'}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleAvailabilityChange('all')}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          
          {filters.levels.map((level) => (
            <Badge key={level} variant="secondary" className="gap-1">
              {level}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleLevelChange(level, false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
          
          {filters.categories.map((category) => (
            <Badge key={category} variant="secondary" className="gap-1">
              {category}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleCategoryChange(category, false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}