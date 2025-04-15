
import React, { useState } from 'react';
import RetroCard from './RetroCard';
import RetroCardGroup from './RetroCardGroup';
import { Flame, ThumbsDown, HeartHandshake, Plus } from 'lucide-react';
import { RetroCardType, CardGroup } from '@/hooks/useRetroSession';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { CardType } from './RetroCard';

interface RetroColumnProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  className?: string;
  cards: RetroCardType[];
  groups: { group: CardGroup; cards: RetroCardType[] }[];
  onVote: (id: string) => void;
  onAddComment: (id: string, content: string) => void;
  onCreateAction: (cardId: string) => void;
  onEditComment?: (cardId: string, commentId: string, newContent: string) => void;
  onDeleteComment?: (cardId: string, commentId: string) => void;
  onDrop?: (cardId: string, targetCardId: string) => void;
  onRemoveCardFromGroup: (cardId: string) => void;
  onEditGroupTitle: (groupId: string, newTitle: string) => void;
  votedCards: Set<string>;
  currentUser?: string;
  onAddCard: (content: string, type: CardType) => void;
  type: CardType;
  isSubmitting?: boolean;
}

const RetroColumns: React.FC<RetroColumnProps> = ({
  title,
  icon,
  count,
  className,
  cards,
  groups,
  onVote,
  onAddComment,
  onCreateAction,
  onEditComment,
  onDeleteComment,
  onDrop,
  onRemoveCardFromGroup,
  onEditGroupTitle,
  votedCards,
  currentUser,
  onAddCard,
  type,
  isSubmitting,
}) => {
  const [newCardContent, setNewCardContent] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    if (newCardContent.trim()) {
      onAddCard(newCardContent.trim(), type);
      setNewCardContent("");
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-bold flex items-center ${className}`}>
          {icon}
          <span className="ml-2">{title}</span>
          <span className={`ml-2 bg-opacity-50 text-opacity-90 text-xs px-2 py-1 rounded ${className.replace('text-', 'bg-')}`}>
            {count}
          </span>
        </h2>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className={`hover:bg-opacity-20 ${className}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-pornoretro-black border-pornoretro-orange/30">
            <DialogHeader>
              <DialogTitle className="text-pornoretro-orange">Aggiungi una nuova scheda {title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Cosa vuoi condividere con il team?"
                value={newCardContent}
                onChange={(e) => setNewCardContent(e.target.value)}
                className="min-h-[100px] bg-secondary/20 border-secondary/30"
              />
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !newCardContent.trim()} 
                className="w-full bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange"
              >
                {isSubmitting ? 'Adding...' : 'Aggiungi scheda'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Groups */}
      {groups.map(({group, cards}) => (
        <RetroCardGroup
          key={group.id}
          id={group.id}
          title={group.title}
          cards={cards}
          onVote={onVote}
          onAddComment={onAddComment}
          onCreateAction={onCreateAction}
          onEditComment={onEditComment}
          onDeleteComment={onDeleteComment}
          onRemoveCard={onRemoveCardFromGroup}
          onEditTitle={onEditGroupTitle}
          votedCards={votedCards}
          currentUser={currentUser}
        />
      ))}
      
      {/* Individual Cards */}
      {cards.map(card => (
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
          onDrop={onDrop}
          hasVoted={votedCards.has(card.id)}
          currentUser={currentUser}
        />
      ))}
      
      {cards.length === 0 && groups.length === 0 && (
        <div className="text-center p-12 border border-dashed border-muted rounded-lg">
          <p className="text-muted-foreground">Non ci sono ancora schede {title}</p>
        </div>
      )}
    </div>
  );
};

export default RetroColumns;
