
import React, { useState } from 'react';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ActionItemType {
  id: string;
  text: string;
  completed: boolean;
  assignee: string;
}

interface ActionItemProps {
  item: ActionItemType;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

const ActionItem: React.FC<ActionItemProps> = ({ item, onToggleComplete, onDelete }) => {
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
        
        <div>
          <p className={`${item.completed ? 'line-through text-muted-foreground' : 'text-pornoretro-gray'}`}>
            {item.text}
          </p>
          {item.assignee && (
            <p className="text-sm text-pornoretro-orange">
              Assigned to: {item.assignee}
            </p>
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
