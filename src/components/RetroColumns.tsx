
import React from 'react';
import RetroCard from './RetroCard';
import RetroCardGroup from './RetroCardGroup';
import { Flame, ThumbsDown, HeartHandshake } from 'lucide-react';
import { RetroCardType, CardGroup } from '@/hooks/useRetroSession';

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
}) => {
  return (
    <div className="space-y-6">
      <h2 className={`text-xl font-bold flex items-center ${className}`}>
        {icon}
        <span className="ml-2">{title}</span>
        <span className={`ml-2 bg-opacity-50 text-opacity-90 text-xs px-2 py-1 rounded ${className.replace('text-', 'bg-')}`}>
          {count}
        </span>
      </h2>
      
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
