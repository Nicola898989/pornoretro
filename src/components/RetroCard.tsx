
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CardType = 'hot' | 'disappointment' | 'fantasy';

interface RetroCardProps {
  id: string;
  type: CardType;
  content: string;
  author: string;
  votes: number;
  onVote: (id: string) => void;
  hasVoted: boolean;
}

const cardStyles = {
  hot: "border-green-500 bg-gradient-to-br from-pornoretro-black to-green-950",
  disappointment: "border-red-500 bg-gradient-to-br from-pornoretro-black to-red-950",
  fantasy: "border-pornoretro-orange bg-gradient-to-br from-pornoretro-black to-pornoretro-darkorange/30"
};

const cardTitles = {
  hot: "Hot Moment",
  disappointment: "Disappointment",
  fantasy: "Team Fantasy"
};

const RetroCard: React.FC<RetroCardProps> = ({ 
  id, 
  type, 
  content, 
  author, 
  votes, 
  onVote, 
  hasVoted 
}) => {
  return (
    <Card className={cn("border-2", cardStyles[type])}>
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          {cardTitles[type]}
        </CardTitle>
        <CardDescription>
          Posted by {author}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-md">
        {content}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <span className="text-sm">{votes} vote{votes !== 1 ? 's' : ''}</span>
        <Button 
          size="sm" 
          variant={hasVoted ? "default" : "outline"}
          className={cn(
            hasVoted ? "bg-pornoretro-orange text-pornoretro-black" : "border-pornoretro-orange text-pornoretro-orange"
          )}
          onClick={() => onVote(id)}
          disabled={hasVoted}
        >
          <ThumbsUp className="w-4 h-4 mr-2" />
          {hasVoted ? "Voted" : "Vote"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RetroCard;
