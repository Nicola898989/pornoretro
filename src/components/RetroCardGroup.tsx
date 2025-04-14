import React, { useState } from 'react';
import RetroCard, { CardType, Comment } from './RetroCard';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Save, X, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEditTitle = () => {
    if (newTitle.trim()) {
      onEditTitle(id, newTitle.trim());
      setIsEditingTitle(false);
    }
  };

  const sortedCards = [...cards].sort((a, b) => b.votes - a.votes);
  
  // Get the primary card (with most votes) to display when collapsed
  const primaryCard = sortedCards.length > 0 ? sortedCards[0] : null;
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDropTarget) setIsDropTarget(true);
  };
  
  const handleDragLeave = () => {
    setIsDropTarget(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTarget(false);
    
    const cardId = e.dataTransfer.getData('card_id');
    if (cardId) {
      console.log(`Card dropped into group: ${cardId} into group ${id}`);
    }
  };

  return (
    <Card 
      className={`border-2 border-pornoretro-darkorange bg-gradient-to-br from-pornoretro-black to-pornoretro-black/80 overflow-hidden ${isDropTarget ? 'ring-2 ring-pornoretro-orange ring-opacity-60' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {cards.length} card{cards.length !== 1 ? 's' : ''}
              </span>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 text-pornoretro-orange hover:text-pornoretro-darkorange hover:bg-secondary/50"
                onClick={() => setIsEditingTitle(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4">
        {cards.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="cards" className="border-b-0">
              <div className="relative">
                {/* Primary Card - Always visible */}
                <div className="mb-2">
                  <RetroCard
                    key={primaryCard?.id}
                    id={primaryCard?.id || ''}
                    type={primaryCard?.type || 'hot'}
                    content={primaryCard?.content || ''}
                    author={primaryCard?.author || ''}
                    votes={primaryCard?.votes || 0}
                    comments={primaryCard?.comments || []}
                    onVote={onVote}
                    onAddComment={onAddComment}
                    onCreateAction={onCreateAction}
                    onEditComment={onEditComment}
                    onDeleteComment={onDeleteComment}
                    onRemoveFromGroup={() => onRemoveCard(primaryCard?.id || '')}
                    hasVoted={votedCards.has(primaryCard?.id || '')}
                    currentUser={currentUser}
                    inGroup={true}
                  />
                </div>
                
                {/* Group indicator badge */}
                {cards.length > 1 && (
                  <div className="absolute top-2 right-2 z-10">
                    <AccordionTrigger className="bg-pornoretro-darkorange/80 text-white rounded-full p-1 h-8 w-8 hover:bg-pornoretro-orange flex items-center justify-center hover:no-underline">
                      <Layers className="h-4 w-4" />
                    </AccordionTrigger>
                  </div>
                )}
                
                {/* Remaining cards - expandable */}
                {cards.length > 1 && (
                  <AccordionContent className="pt-4">
                    <div className="grid grid-cols-1 gap-4">
                      {sortedCards.slice(1).map(card => (
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
                    </div>
                  </AccordionContent>
                )}
              </div>
            </AccordionItem>
          </Accordion>
        ) : (
          <p className="text-muted-foreground">No cards in this group</p>
        )}
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
