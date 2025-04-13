
import React, { useState } from 'react';
import RetroCard, { CardType, Comment } from './RetroCard';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Save, X } from 'lucide-react';

interface RetroCardType {
  id: string;
  type: CardType;
  content: string;
  author: string;
  votes: number;
  comments: Comment[];
  groupId?: string;
}

interface RetroCardGroupProps {
  id: string;
  title: string;
  cards: RetroCardType[];
  onVote: (id: string) => void;
  onAddComment: (id: string, content: string) => void;
  onCreateAction: (cardId: string) => void;
  onEditComment?: (cardId: string, commentId: string, newContent: string) => void;
  onDeleteComment?: (cardId: string, commentId: string) => void;
  onRemoveCard: (cardId: string) => void;
  onEditTitle: (groupId: string, newTitle: string) => void;
  votedCards: Set<string>;
  currentUser?: string;
}

const RetroCardGroup: React.FC<RetroCardGroupProps> = ({
  id,
  title,
  cards,
  onVote,
  onAddComment,
  onCreateAction,
  onEditComment,
  onDeleteComment,
  onRemoveCard,
  onEditTitle,
  votedCards,
  currentUser
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

  const handleEditTitle = () => {
    if (newTitle.trim()) {
      onEditTitle(id, newTitle.trim());
      setIsEditingTitle(false);
    }
  };

  const sortedCards = [...cards].sort((a, b) => b.votes - a.votes);

  return (
    <Card className="border-2 border-pornoretro-darkorange bg-gradient-to-br from-pornoretro-black to-pornoretro-black/80 overflow-hidden">
      <CardHeader className="bg-pornoretro-darkorange/20 px-4 py-2">
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="h-8 text-lg font-bold bg-secondary/80 border-pornoretro-orange/40"
              autoFocus
            />
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-green-400 hover:text-green-500 hover:bg-secondary/50"
              onClick={handleEditTitle}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-secondary/50"
              onClick={() => {
                setNewTitle(title);
                setIsEditingTitle(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-pornoretro-orange">{title}</h3>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-pornoretro-orange hover:text-pornoretro-darkorange hover:bg-secondary/50"
              onClick={() => setIsEditingTitle(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {sortedCards.map(card => (
          <RetroCard
            key={card.id}
            id={card.id}
            type={card.type}
            content={card.content}
            author={card.author}
            votes={card.votes}
            comments={card.comments}
            onVote={onVote}
            onAddComment={onAddComment}
            onCreateAction={onCreateAction}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
            onRemoveFromGroup={() => onRemoveCard(card.id)}
            hasVoted={votedCards.has(card.id)}
            currentUser={currentUser}
            inGroup={true}
          />
        ))}
      </CardContent>
      
      <CardFooter className="bg-secondary/10 px-4 py-2">
        <p className="text-xs text-muted-foreground">
          {cards.length} card{cards.length !== 1 ? 's' : ''} • 
          {cards.reduce((sum, card) => sum + card.votes, 0)} vote{cards.reduce((sum, card) => sum + card.votes, 0) !== 1 ? 's' : ''} • 
          {cards.reduce((sum, card) => sum + card.comments.length, 0)} comment{cards.reduce((sum, card) => sum + card.comments.length, 0) !== 1 ? 's' : ''}
        </p>
      </CardFooter>
    </Card>
  );
};

export default RetroCardGroup;
