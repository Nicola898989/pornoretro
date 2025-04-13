
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CardType } from './RetroCard';
import { useToast } from '@/hooks/use-toast';

interface AddCardFormProps {
  onAddCard: (content: string, type: CardType) => void;
}

const AddCardForm: React.FC<AddCardFormProps> = ({ onAddCard }) => {
  const [content, setContent] = useState('');
  const [type, setType] = useState<CardType>('hot');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Empty content",
        description: "Please write something to add a card",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onAddCard(content.trim(), type);
      setContent('');
    } catch (error) {
      console.error("Error adding card:", error);
      toast({
        title: "Error",
        description: "Failed to add your card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-pornoretro-orange/50">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-xl text-pornoretro-orange">Share Your Thoughts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            placeholder="What's on your mind about the sprint?" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] bg-secondary text-pornoretro-gray"
            disabled={isLoading}
          />
          
          <RadioGroup 
            defaultValue="hot" 
            onValueChange={(val) => setType(val as CardType)} 
            className="flex flex-col space-y-2"
            disabled={isLoading}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hot" id="hot" />
              <Label htmlFor="hot" className="text-green-400">Hot Moment (Something that went well)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="disappointment" id="disappointment" />
              <Label htmlFor="disappointment" className="text-red-400">Disappointment (Something that didn't go well)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fantasy" id="fantasy" />
              <Label htmlFor="fantasy" className="text-pornoretro-orange">Team Fantasy (Ideas for improvement)</Label>
            </div>
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange"
            disabled={isLoading}
          >
            {isLoading ? 'Posting...' : 'Post Anonymously'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default AddCardForm;
