
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CardType } from '@/components/RetroCard';
import { Flame, ThumbsDown, HeartHandshake } from 'lucide-react';

interface NewRetroCardProps {
  onAddCard: (content: string, type: CardType) => void;
  isSubmitting?: boolean;
}

const NewRetroCard: React.FC<NewRetroCardProps> = ({ onAddCard, isSubmitting = false }) => {
  const [newCardContent, setNewCardContent] = useState("");
  const [newCardType, setNewCardType] = useState<CardType>('hot');

  const handleSubmit = () => {
    if (newCardContent.trim()) {
      onAddCard(newCardContent.trim(), newCardType);
      setNewCardContent("");
    }
  };

  return (
    <Card className="border-pornoretro-orange/30 bg-pornoretro-black/90">
      <CardHeader>
        <CardTitle className="text-xl text-pornoretro-orange">Aggiungi una nuova scheda</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant={newCardType === 'hot' ? 'default' : 'outline'} 
              className={`flex items-center ${newCardType === 'hot' ? 'bg-green-600 hover:bg-green-700' : 'border-green-500 text-green-500 hover:bg-green-900/20'}`}
              onClick={() => setNewCardType('hot')}
            >
              <Flame className="w-4 h-4 mr-2" />
              Hot Moments
            </Button>
            <Button 
              variant={newCardType === 'disappointment' ? 'default' : 'outline'} 
              className={`flex items-center ${newCardType === 'disappointment' ? 'bg-red-600 hover:bg-red-700' : 'border-red-500 text-red-500 hover:bg-red-900/20'}`}
              onClick={() => setNewCardType('disappointment')}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              Disappointments
            </Button>
            <Button 
              variant={newCardType === 'fantasy' ? 'default' : 'outline'} 
              className={`flex items-center ${newCardType === 'fantasy' ? 'bg-pornoretro-orange hover:bg-pornoretro-darkorange' : 'border-pornoretro-orange text-pornoretro-orange hover:bg-pornoretro-orange/20'}`}
              onClick={() => setNewCardType('fantasy')}
            >
              <HeartHandshake className="w-4 h-4 mr-2" />
              Team Fantasy
            </Button>
          </div>
          <Textarea
            placeholder="Cosa vuoi condividere con il team?"
            value={newCardContent}
            onChange={(e) => setNewCardContent(e.target.value)}
            className="min-h-[100px] bg-secondary/20 border-secondary/30"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !newCardContent.trim()} 
          className="w-full bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange"
        >
          {isSubmitting ? 'Adding...' : 'Aggiungi scheda'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NewRetroCard;
