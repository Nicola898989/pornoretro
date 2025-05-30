
import { useCardOperations } from './useCardOperations';
import { useCardVoting } from './useCardVoting';
import { useCardCategories } from './useCardCategories';
import { useCardRealtime } from './useCardRealtime';
import { RetroCardType, CardType, RetroData } from '@/types/retro';

export const useRetroCards = () => {
  const cardOps = useCardOperations();
  const voting = useCardVoting();
  const categories = useCardCategories();
  const realtime = useCardRealtime();

  // Enhanced fetchCards that also initializes voting state
  const fetchCards = async (retroId: string, username?: string) => {
    const cards = await cardOps.fetchCards(retroId);
    if (username && cards.length > 0) {
      // Initialize voted cards based on fetched data
      const rawData = await import('@/services/retroService').then(service => service.fetchCards(retroId));
      voting.initializeVotedCards(rawData, username);
    }
    return cards;
  };

  const handleChangeCardCategory = (cardId: string, newType: CardType) => {
    return categories.handleChangeCardCategory(cardId, newType, cardOps.cards, cardOps.setCards);
  };

  const insertCard = (newCard: any, username: string, retroData: RetroData | null) => {
    return realtime.insertCard(newCard, username, retroData, cardOps.setCards);
  };

  const updateCard = (updatedCard: any) => {
    return realtime.updateCard(updatedCard, cardOps.setCards);
  };

  const deleteCard = (deletedCard: any) => {
    return realtime.deleteCard(deletedCard, cardOps.setCards);
  };

  return {
    // Card state
    cards: cardOps.cards,
    setCards: cardOps.setCards,
    
    // Voting state
    votedCards: voting.votedCards,
    
    // Card operations
    fetchCards,
    handleAddCard: cardOps.handleAddCard,
    handleEditCard: cardOps.handleEditCard,
    handleDeleteCard: cardOps.handleDeleteCard,
    
    // Voting operations
    handleVote: voting.handleVote,
    
    // Category operations
    handleChangeCardCategory,
    
    // Real-time operations
    insertCard,
    updateCard,
    deleteCard,
  };
};
