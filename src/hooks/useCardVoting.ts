
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import * as retroService from '@/services/retroService';

export const useCardVoting = () => {
  const { toast } = useToast();
  const [votedCards, setVotedCards] = useState<Set<string>>(new Set());

  const initializeVotedCards = (cards: any[], username: string) => {
    const userVotedCards = new Set<string>();
    
    cards.forEach(card => {
      const userVoted = card.retro_card_votes && card.retro_card_votes.some(vote => vote.user_id === username);
      if (userVoted) {
        userVotedCards.add(card.id);
      }
    });

    setVotedCards(userVotedCards);
  };

  const handleVote = async (cardId: string, username: string) => {
    if (!username) return;

    const hasVoted = votedCards.has(cardId);

    try {
      await retroService.toggleVote(cardId, username, hasVoted);

      if (hasVoted) {
        setVotedCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(cardId);
          return newSet;
        });

        toast({
          title: "Voto rimosso",
          description: "Il tuo voto è stato rimosso",
        });
      } else {
        setVotedCards(prev => new Set([...prev, cardId]));

        toast({
          title: "Voto aggiunto!",
          description: "Il tuo voto è stato registrato",
        });
      }
    } catch (error) {
      console.error("Error toggling vote:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il voto. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  return {
    votedCards,
    setVotedCards,
    initializeVotedCards,
    handleVote,
  };
};
