
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type CardType = 'hot' | 'disappointment' | 'fantasy';

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface RetroCardProps {
  id: string;
  type: CardType;
  content: string;
  author: string;
  votes: number;
  comments?: Comment[];
  onVote: (id: string) => void;
  onAddComment: (id: string, content: string) => void;
  onCreateAction: (cardId: string) => void;
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
  comments = [],
  onVote,
  onAddComment,
  onCreateAction,
  hasVoted 
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(id, newComment.trim());
      setNewComment('');
    }
  };

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
      <CardFooter className="flex flex-col gap-2">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <span className="text-sm">{votes} vote{votes !== 1 ? 's' : ''}</span>
            <Button
              size="sm"
              variant="ghost"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="w-4 h-4" />
              {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              className="text-xs"
              onClick={() => onCreateAction(id)}
            >
              <PlusCircle className="w-3 h-3 mr-1" />
              Create Action
            </Button>
            <Button 
              size="sm" 
              variant={hasVoted ? "default" : "outline"}
              className={cn(
                hasVoted ? "bg-pornoretro-orange text-pornoretro-black" : "border-pornoretro-orange text-pornoretro-orange"
              )}
              onClick={() => onVote(id)}
              disabled={hasVoted}
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              {hasVoted ? "Voted" : "Vote"}
            </Button>
          </div>
        </div>
        
        {showComments && (
          <div className="w-full pt-3 border-t border-muted">
            <div className="space-y-3 max-h-60 overflow-y-auto mb-2">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-secondary/50 p-3 rounded-md">
                    <div className="flex justify-between">
                      <p className="text-xs font-medium text-pornoretro-orange">{comment.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px] bg-secondary/50 text-sm"
              />
              <Button 
                type="submit"
                size="sm" 
                className="bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange self-end"
              >
                Comment
              </Button>
            </form>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default RetroCard;
