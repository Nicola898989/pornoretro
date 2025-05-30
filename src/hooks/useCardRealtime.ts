
import { RetroCardType, CardType, RetroData } from '@/types/retro';

export const useCardRealtime = () => {
  const insertCard = (
    newCard: any, 
    username: string, 
    retroData: RetroData | null,
    setCards: (fn: (prev: RetroCardType[]) => RetroCardType[]) => void
  ) => {
    // Skip if the card was added by current user (already in state)
    if (newCard.author === username && !retroData?.is_anonymous) {
      return;
    }

    // Convert to our RetroCardType format
    const processedCard: RetroCardType = {
      id: newCard.id,
      type: newCard.type as CardType,
      content: newCard.content,
      author: newCard.author,
      votes: 0,
      comments: [],
      groupId: newCard.group_id || undefined
    };

    // Add to state
    setCards(prev => {
      // Make sure we don't add duplicates
      if (prev.some(card => card.id === processedCard.id)) {
        return prev;
      }
      return [...prev, processedCard];
    });
  };

  const updateCard = (
    updatedCard: any,
    setCards: (fn: (prev: RetroCardType[]) => RetroCardType[]) => void
  ) => {
    setCards(prev => 
      prev.map(card => {
        if (card.id === updatedCard.id) {
          return {
            ...card,
            content: updatedCard.content,
            groupId: updatedCard.group_id || undefined,
          };
        }
        return card;
      })
    );
  };

  const deleteCard = (
    deletedCard: any,
    setCards: (fn: (prev: RetroCardType[]) => RetroCardType[]) => void
  ) => {
    setCards(prev => prev.filter(card => card.id !== deletedCard.id));
  };

  return {
    insertCard,
    updateCard,
    deleteCard,
  };
};
