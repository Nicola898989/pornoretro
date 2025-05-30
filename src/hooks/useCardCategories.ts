
import { useToast } from "@/hooks/use-toast";
import * as retroService from '@/services/retroService';
import { CardType, RetroCardType } from '@/types/retro';

export const useCardCategories = () => {
  const { toast } = useToast();

  const handleChangeCardCategory = async (
    cardId: string, 
    newType: CardType, 
    cards: RetroCardType[], 
    setCards: (fn: (prev: RetroCardType[]) => RetroCardType[]) => void
  ) => {
    const currentCard = cards.find(card => card.id === cardId);
    if (!currentCard || currentCard.type === newType) {
      toast({
        title: "Nessun cambiamento",
        description: "La carta è già in questa categoria",
      });
      return;
    }
    
    const originalType = currentCard.type; // Store the original type for revert
    
    try {
      // Update local state immediately for better UX
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === cardId 
            ? { ...card, type: newType } 
            : card
        )
      );

      await retroService.changeCardCategory(cardId, newType);

      toast({
        title: "Categoria cambiata",
        description: `La carta è stata spostata in ${newType === 'hot' ? 'Hot Moments' : newType === 'disappointment' ? 'Disappointments' : 'Team Fantasy'}`,
      });
    } catch (error) {
      console.error("Error changing card category:", error);
      
      // Revert local state on error using the stored original type
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === cardId 
            ? { ...card, type: originalType } 
            : card
        )
      );
      
      toast({
        title: "Errore",
        description: "Impossibile cambiare la categoria della carta. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  return {
    handleChangeCardCategory,
  };
};
