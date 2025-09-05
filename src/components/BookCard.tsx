import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface BookCardProps {
  id: string;
  title: string;
  authors: string[];
  level: string;
  categories: string[];
  availableCount: number;
  totalCopies: number;
  coverPath?: string;
  description?: string;
  onBorrow: (bookId: string) => void;
  onViewDetails: (bookId: string) => void;
}

export const BookCard = ({
  id,
  title,
  authors,
  level,
  categories,
  availableCount,
  totalCopies,
  coverPath,
  description,
  onBorrow,
  onViewDetails,
}: BookCardProps) => {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const isAvailable = availableCount > 0;
  
  return (
    <Card 
      ref={ref as any}
      className={`group transition-all duration-700 ease-apple backdrop-blur-xl bg-white/60 dark:bg-black/40 border border-white/20 dark:border-white/10 shadow-apple-lg hover:shadow-apple-xl hover:-translate-y-2 hover:scale-105 rounded-2xl overflow-hidden ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Cover Image Section */}
      {coverPath && (
        <div className="relative h-48 w-full overflow-hidden">
          <img 
            src={coverPath} 
            alt={title}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      )}
      
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-base sm:text-lg font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {title}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground">
          by {authors.join(", ")}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3 sm:pb-4">
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 leading-relaxed">
            {description}
          </p>
        )}
        
        {/* Tags with Apple-style styling */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-medium px-2 sm:px-3 py-1 rounded-full">
            {level}
          </Badge>
          {categories.slice(0, 2).map((category) => (
            <Badge key={category} variant="outline" className="text-xs font-medium px-2 sm:px-3 py-1 rounded-full border-border/50 hover:border-primary/30 transition-colors">
              {category}
            </Badge>
          ))}
          {categories.length > 2 && (
            <Badge variant="outline" className="text-xs font-medium px-2 sm:px-3 py-1 rounded-full border-border/50">
              +{categories.length - 2}
            </Badge>
          )}
        </div>
        
        {/* Availability Info with Apple-style icons */}
        <div className="flex items-center justify-between text-xs sm:text-sm bg-muted/30 rounded-xl p-2 sm:p-3">
          <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
            <span className="font-medium">{totalCopies} copies</span>
          </div>
          <div className={`flex items-center gap-1 sm:gap-2 font-semibold ${
            isAvailable ? "text-success" : "text-destructive"
          }`}>
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
              isAvailable ? "bg-success/10" : "bg-destructive/10"
            }`}>
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
            <span>
              {isAvailable ? `${availableCount} available` : "Not available"}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 pb-4 sm:pb-6 gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(id)}
          className="flex-1 rounded-full border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 text-xs sm:text-sm"
        >
          Details
        </Button>
        <Button
          onClick={() => onBorrow(id)}
          disabled={!isAvailable}
          size="sm"
          className="flex-1 rounded-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-300 hover:scale-105 active:scale-95 text-xs sm:text-sm"
        >
          {isAvailable ? "Borrow" : "Unavailable"}
        </Button>
      </CardFooter>
    </Card>
  );
};