import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash, Edit, FileText } from 'lucide-react';
import { RetroCardType, CardType } from '@/types/retro';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export type ActionItemType = {
  id: string;
  text: string;
  assignee: string | null;
  completed: boolean;
  linked_card_id: string | null;
  linked_card_content: string | null;
  linked_card_type: CardType | null;
};

interface ActionItemProps {
  item: ActionItemType;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  cards: RetroCardType[];
}

const ActionItem: React.FC<ActionItemProps> = ({ item, onToggleComplete, onDelete, cards }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(item.text);
  const [editedAssignee, setEditedAssignee] = useState(item.assignee || '');

  const handleToggleComplete = () => {
    onToggleComplete(item.id);
  };

  const handleDelete = () => {
    onDelete(item.id);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Implement save functionality here (e.g., API call)
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedText(item.text);
    setEditedAssignee(item.assignee || '');
  };

  const linkedCard = cards.find(card => card.id === item.linked_card_id);

  return (
    <div className="flex items-center justify-between p-4 border-b border-pornoretro-orange/30">
      <div className="flex items-center space-x-3">
        <Checkbox
          id={`action-${item.id}`}
          checked={item.completed}
          onCheckedChange={handleToggleComplete}
        />
        <label
          htmlFor={`action-${item.id}`}
          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${item.completed ? 'line-through text-gray-500' : 'text-white'
            }`}
        >
          {isEditing ? (
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="bg-transparent border border-gray-500 text-white rounded-md p-1 text-sm"
            />
          ) : (
            item.text
          )}
        </label>
        {linkedCard && (
          <div className="flex items-center space-x-1 text-white/60">
            <FileText className="h-3 w-3" />
            <span className="text-xs">{linkedCard.content}</span>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {isEditing ? (
          <>
            <Input
              type="text"
              placeholder="Assignee"
              value={editedAssignee}
              onChange={(e) => setEditedAssignee(e.target.value)}
              className="bg-transparent border border-gray-500 text-white rounded-md p-1 text-sm"
            />
            <Button variant="secondary" size="icon" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            {item.assignee && (
              <div className="text-xs text-white/60">{item.assignee}</div>
            )}
            <Button variant="secondary" size="icon" onClick={handleEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={handleDelete}>
              <Trash className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ActionItem;
