
import React from 'react';
import { ActionItemType } from './ActionItem';
import ActionItem from './ActionItem';
import NewActionItemForm from './NewActionItemForm';
import { CardType } from './RetroCard';
import { RetroCardType } from '@/hooks/useRetroSession';

interface ActionListProps {
  actionItems: ActionItemType[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (text: string, assignee: string, cardId?: string) => void;
  cards?: RetroCardType[];
  selectedCardId?: string;
}

const ActionList: React.FC<ActionListProps> = ({
  actionItems,
  onToggleComplete,
  onDelete,
  onAdd,
  cards = [],
  selectedCardId
}) => {
  const incompleteActions = actionItems.filter(item => !item.completed);
  const completedActions = actionItems.filter(item => item.completed);
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-pornoretro-orange mb-3">New Action Item</h3>
        <NewActionItemForm 
          onAdd={onAdd}
          cards={cards.map(card => ({
            id: card.id,
            content: card.content,
            type: card.type
          }))} 
          selectedCardId={selectedCardId}
        />
      </div>
      
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white flex items-center">
          Action items in progress
          <span className="ml-2 bg-pornoretro-orange bg-opacity-20 text-pornoretro-orange text-xs px-2 py-1 rounded">
            {incompleteActions.length}
          </span>
        </h3>
        
        {incompleteActions.length === 0 ? (
          <p className="text-muted-foreground">No action items in progress</p>
        ) : (
          <div className="space-y-2">
            {incompleteActions.map(item => (
              <ActionItem
                key={item.id}
                item={item}
                onToggleComplete={onToggleComplete}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
      
      {completedActions.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-muted">
          <h3 className="text-lg font-semibold text-white flex items-center">
            Completed action items
            <span className="ml-2 bg-green-500 bg-opacity-20 text-green-500 text-xs px-2 py-1 rounded">
              {completedActions.length}
            </span>
          </h3>
          
          <div className="space-y-2 opacity-80">
            {completedActions.map(item => (
              <ActionItem
                key={item.id}
                item={item}
                onToggleComplete={onToggleComplete}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionList;
