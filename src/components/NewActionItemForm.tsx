
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface NewActionItemFormProps {
  onAdd: (text: string, assignee: string) => void;
}

const NewActionItemForm: React.FC<NewActionItemFormProps> = ({ onAdd }) => {
  const [text, setText] = useState('');
  const [assignee, setAssignee] = useState('');
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
    
    onAdd(text.trim(), assignee.trim());
    setText('');
    setAssignee('');
    
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
      <div className="flex gap-3">
        <Input
          placeholder="Assignee (optional)"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="bg-secondary text-pornoretro-gray"
        />
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
