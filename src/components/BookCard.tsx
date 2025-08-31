import { useState } from "react";
import { Book, Users, Clock, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

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
  onToggleFavorite?: (bookId: string) => void;
  isFavorite?: boolean;
}

export function BookCard({
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
  onToggleFavorite,
  isFavorite = false
}: BookCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Bachelors':
        return 'bg-info text-info-foreground';
      case 'Masters':
        return 'bg-warning text-warning-foreground';
      case 'PhD':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getAvailabilityStatus = () => {
    if (availableCount === 0) {
      return { text: 'Unavailable', color: 'text-destructive', canBorrow: false };
    } else if (availableCount <= 2) {
      return { text: `${availableCount} available`, color: 'text-warning', canBorrow: true };
    } else {
      return { text: `${availableCount} available`, color: 'text-success', canBorrow: true };
    }
  };

  const availability = getAvailabilityStatus();

  return (
    <Card
      className="group relative overflow-hidden bg-gradient-secondary shadow-neumorphic hover:shadow-glass transition-all duration-300 border-0 animate-fade-in"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Book Cover */}
          <div className="w-20 h-28 bg-gradient-primary rounded-xl flex items-center justify-center shadow-neumorphic-inset flex-shrink-0">
            {coverPath ? (
              <img 
                src={coverPath} 
                alt={title}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Book className="w-8 h-8 text-primary-foreground" />
            )}
          </div>

          {/* Book Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {title}
              </h3>
              {onToggleFavorite && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(id);
                  }}
                  className={`p-1 h-auto ${isFavorite ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              by {authors.join(', ')}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={getLevelColor(level)}>
                {level}
              </Badge>
              {categories.slice(0, 2).map((category) => (
                <Badge key={category} variant="outline" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>

            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className={availability.color}>
                  {availability.text}
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{totalCopies} total</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(id);
            }}
            className="flex-1 shadow-neumorphic hover:shadow-neumorphic-inset"
          >
            <Eye className="w-4 h-4 mr-2" />
            Details
          </Button>
          
          {availability.canBorrow ? (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onBorrow(id);
              }}
              className="flex-1 bg-gradient-primary shadow-neumorphic hover:shadow-glow"
            >
              Borrow
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled
              className="flex-1"
            >
              Reserve
            </Button>
          )}
        </div>
      </CardFooter>

      {/* Hover Effect Overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-glass pointer-events-none opacity-50 transition-opacity duration-300" />
      )}
    </Card>
  );
}