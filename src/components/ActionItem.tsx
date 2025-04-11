
import React from 'react';
import { CheckCircle2, Circle, Trash2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardType } from './RetroCard';

export interface ActionItemType {
  id: string;
  text: string;
  completed: boolean;
  assignee: string;
  linkedCardId?: string;
  linkedCardContent?: string;
  linkedCardType?: CardType;
}

interface ActionItemProps {
  item: ActionItemType;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

const ActionItem: React.FC<ActionItemProps> = ({ item, onToggleComplete, onDelete }) => {
  const cardTypeColors = {
    hot: "text-green-400",
    disappointment: "text-red-400",
    fantasy: "text-pornoretro-orange"
  };

  return (
    <div className="flex items-center justify-between p-3 border border-muted rounded-md bg-secondary">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onToggleComplete(item.id)}
          className="p-0 hover:opacity-70"
        >
          {item.completed ? (
            <CheckCircle2 className="h-6 w-6 text-pornoretro-orange" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground" />
          )}
        </Button>
        
        <div className="space-y-1">
          <p className={`${item.completed ? 'line-through text-muted-foreground' : 'text-pornoretro-gray'}`}>
            {item.text}
          </p>
          
          {item.assignee && (
            <p className="text-sm text-pornoretro-orange">
              Assigned to: {item.assignee}
            </p>
          )}
          
          {item.linkedCardId && item.linkedCardContent && item.linkedCardType && (
            <div className="flex items-center gap-1 text-xs">
              <LinkIcon className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Linked to:</span>
              <span className={cardTypeColors[item.linkedCardType]}>
                {item.linkedCardContent.substring(0, 30)}
                {item.linkedCardContent.length > 30 ? '...' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => onDelete(item.id)}
        className="text-muted-foreground hover:text-red-500"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ActionItem;
