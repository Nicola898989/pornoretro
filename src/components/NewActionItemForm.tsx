
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface CardInfo {
  id: string;
  content: string;
  type: string;
}

interface NewActionItemFormProps {
  onAdd: (text: string, assignee: string, cardId?: string) => void;
  cards?: CardInfo[];
  selectedCardId?: string;
}

const NewActionItemForm: React.FC<NewActionItemFormProps> = ({ onAdd, cards = [], selectedCardId = '' }) => {
  const [text, setText] = useState('');
  const [assignee, setAssignee] = useState('');
  const [cardId, setCardId] = useState(selectedCardId);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      toast({
        title: "Empty action item",
        description: "Please write something for the action item",
        variant: "destructive",
      });
      return;
    }
    
    onAdd(text.trim(), assignee.trim(), cardId || undefined);
    setText('');
    setAssignee('');
    if (!selectedCardId) setCardId('');
    
    toast({
      title: "Action item added",
      description: "New action item has been added to the list",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Input
          placeholder="What needs to be done?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="bg-secondary text-pornoretro-gray"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Input
            placeholder="Assignee (optional)"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="bg-secondary text-pornoretro-gray"
          />
        </div>
        
        {!selectedCardId && cards.length > 0 && (
          <div>
            <Select value={cardId} onValueChange={setCardId}>
              <SelectTrigger className="bg-secondary text-pornoretro-gray">
                <SelectValue placeholder="Link to card (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-link">No linked card</SelectItem>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.content.substring(0, 30)}{card.content.length > 30 ? '...' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit"
          className="bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange"
        >
          Add Action
        </Button>
      </div>
    </form>
  );
};

export default NewActionItemForm;
