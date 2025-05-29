
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import * as retroService from '@/services/retroService';
import { RetroCardType, CardType, RetroData } from '@/types/retro';

export const useRetroCards = () => {
  const { toast } = useToast();
  const [cards, setCards] = useState<RetroCardType[]>([]);
  const [votedCards, setVotedCards] = useState<Set<string>>(new Set());

  const fetchCards = async (retroId: string) => {
    try {
      const data = await retroService.fetchCards(retroId);

      // Process the data
      const processedCards = data.map(card => {
        const comments = (card.retro_comments || []).map(comment => ({
          id: comment.id,
          author: comment.author,
          content: comment.content,
          createdAt: comment.created_at
        }));

        const votes = (card.retro_card_votes || []).length;
        
        const userVoted = card.retro_card_votes && card.retro_card_votes.some(vote => vote.user_id === localStorage.getItem('currentUser'));
        if (userVoted) {
          setVotedCards(prev => new Set([...prev, card.id]));
        }

        return {
          id: card.id,
          type: card.type as CardType,
          content: card.content,
          author: card.author,
          votes,
          comments,
          groupId: card.group_id || undefined
        };
      });

      setCards(processedCards);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load retrospective cards",
        variant: "destructive",
      });
    }
  };

  const handleAddCard = async (retroId: string, content: string, type: CardType, retroData: RetroData, username: string) => {
    if (!content.trim() || !username || !retroData) {
      toast({
        title: "Impossibile aggiungere la scheda",
        description: "Per favore, inserisci un contenuto valido",
        variant: "destructive",
      });
      return;
    }

    try {
      const author = retroData.is_anonymous ? 'Anonymous' : username;
      await retroService.addCard(retroId, content, type, author);
      
      // Ricarica immediatamente le carte per mostrare quella appena aggiunta
      await fetchCards(retroId);
      
      toast({
        title: "Scheda aggiunta!",
        description: "La tua scheda è stata aggiunta alla retrospettiva",
      });
    } catch (error) {
      console.error("Error adding card:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere la scheda. Riprova più tardi.",
        variant: "destructive",
      });
    }
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

  const handleEditCard = async (cardId: string, newContent: string) => {
    try {
      const currentCard = cards.find(card => card.id === cardId);
      if (!currentCard || currentCard.content === newContent.trim()) {
        toast({
          title: "Nessun cambiamento",
          description: "Il contenuto della card non è stato modificato",
        });
        return;
      }
      
      // Update local state immediately for better UX
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === cardId 
            ? { ...card, content: newContent.trim() } 
            : card
        )
      );

      await retroService.editCard(cardId, newContent);

      toast({
        title: "Card aggiornata",
        description: "Il contenuto della card è stato aggiornato",
      });
    } catch (error) {
      console.error("Error updating card:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la card. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await retroService.deleteCard(cardId);

      toast({
        title: "Card eliminata",
        description: "La card è stata eliminata con successo",
      });
    } catch (error) {
      console.error("Error deleting card:", error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare la card. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const insertCard = (newCard: any, username: string, retroData: RetroData | null) => {
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

  const updateCard = (updatedCard: any) => {
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

  const deleteCard = (deletedCard: any) => {
    setCards(prev => prev.filter(card => card.id !== deletedCard.id));
  };

  return {
    cards,
    votedCards,
    setCards,
    fetchCards,
    handleAddCard,
    handleVote,
    handleEditCard,
    handleDeleteCard,
    insertCard,
    updateCard,
    deleteCard,
  };
};
