import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { useRetroRealtime } from './useRetroRealtime';
import * as retroService from '@/services/retroService';
import { RetroData, RetroCardType, CardGroup, ActionItemType, CardType } from '@/types/retro';

// Use proper syntax for re-exporting types with isolatedModules enabled
export type { RetroData, RetroCardType, CardGroup, ActionItemType, CardType };

export const useRetroSession = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [retroData, setRetroData] = useState<RetroData | null>(null);
  const [cards, setCards] = useState<RetroCardType[]>([]);
  const [cardGroups, setCardGroups] = useState<CardGroup[]>([]);
  const [votedCards, setVotedCards] = useState<Set<string>>(new Set());
  const [username, setUsername] = useState<string>("");
  const [actionItems, setActionItems] = useState<ActionItemType[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUsername(storedUser);
    }

    if (id) {
      fetchRetroData();
      fetchCards();
      fetchCardGroups();
      fetchActionItems();
    }
  }, [id]);

  // Set up real-time subscriptions
  const realtimeHandlers = {
    onCardInsert: (newCard: any) => {
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
        votes: 0, // We'll get actual votes in the next fetch
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

      // Notify user about new card (optional)
      toast({
        title: "Nuova scheda aggiunta",
        description: `${processedCard.author} ha aggiunto una nuova scheda`,
      });
    },
    onCardUpdate: (updatedCard: any) => {
      setCards(prev => 
        prev.map(card => {
          if (card.id === updatedCard.id) {
            return {
              ...card,
              content: updatedCard.content,
              groupId: updatedCard.group_id || undefined,
              // Keep existing comments and votes as they are not included in the update payload
            };
          }
          return card;
        })
      );
    },
    onCardDelete: (deletedCard: any) => {
      setCards(prev => prev.filter(card => card.id !== deletedCard.id));
    },
    onCardGroupInsert: (newGroup: CardGroup) => {
      setCardGroups(prev => [...prev, newGroup]);
    },
    onCardGroupUpdate: (updatedGroup: CardGroup) => {
      setCardGroups(prev => 
        prev.map(group => group.id === updatedGroup.id ? updatedGroup : group)
      );
    },
    onCardGroupDelete: (deletedGroup: any) => {
      setCardGroups(prev => prev.filter(group => group.id !== deletedGroup.id));
    },
    onActionInsert: (newAction: ActionItemType) => {
      setActionItems(prev => [...prev, newAction]);
    },
    onActionUpdate: (updatedAction: ActionItemType) => {
      setActionItems(prev => 
        prev.map(action => action.id === updatedAction.id ? updatedAction : action)
      );
    },
    onActionDelete: (deletedAction: any) => {
      setActionItems(prev => prev.filter(action => action.id !== deletedAction.id));
    },
    onCommentChange: () => fetchCards(),
    onVoteChange: () => fetchCards(),
    username
  };
  
  useRetroRealtime(id, realtimeHandlers);

  const fetchRetroData = async () => {
    if (!id) return;
    
    try {
      const data = await retroService.fetchRetroData(id);
      setRetroData(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load retrospective data",
        variant: "destructive",
      });
    }
  };

  const fetchCards = async () => {
    if (!id) return;
    
    try {
      const data = await retroService.fetchCards(id);

      // Process the data
      const processedCards = data.map(card => {
        const comments = (card.retro_comments || []).map(comment => ({
          id: comment.id,
          author: comment.author,
          content: comment.content,
          createdAt: comment.created_at
        }));

        const votes = (card.retro_card_votes || []).length;
        
        const userVoted = card.retro_card_votes && card.retro_card_votes.some(vote => vote.user_id === username);
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

  const fetchCardGroups = async () => {
    if (!id) return;
    
    try {
      const data = await retroService.fetchCardGroups(id);
      setCardGroups(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load card groups",
        variant: "destructive",
      });
    }
  };

  const fetchActionItems = async () => {
    if (!id) return;
    
    try {
      const data = await retroService.fetchActionItems(id);
      setActionItems(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load action items",
        variant: "destructive",
      });
    }
  };

  // CRUD operations for cards
  const handleAddCard = async (content: string, type: CardType) => {
    if (!content.trim() || !username || !retroData || !id) {
      toast({
        title: "Impossibile aggiungere la scheda",
        description: "Per favore, inserisci un contenuto valido",
        variant: "destructive",
      });
      return;
    }

    try {
      const author = retroData.is_anonymous ? 'Anonymous' : username;
      await retroService.addCard(id, content, type, author);
      
      // Ricarica immediatamente le carte per mostrare quella appena aggiunta
      await fetchCards();
      
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

  const handleVote = async (cardId: string) => {
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

      fetchCards();
    } catch (error) {
      console.error("Error toggling vote:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il voto. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (cardId: string, content: string) => {
    if (!content.trim() || !username || !retroData) return;

    try {
      const author = retroData.is_anonymous ? 'Anonymous' : username;
      await retroService.addComment(cardId, content, author);

      toast({
        title: "Commento aggiunto",
        description: "Il tuo commento è stato aggiunto",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il commento. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const handleCreateAction = async (text: string, assignee: string, cardId?: string) => {
    if (!id || !text.trim()) {
      toast({
        title: "Error",
        description: "Cannot create empty action",
        variant: "destructive",
      });
      return;
    }

    try {
      let linkedCardContent;
      let linkedCardType;
      
      if (cardId) {
        const linkedCard = cards.find(card => card.id === cardId);
        if (linkedCard) {
          linkedCardContent = linkedCard.content;
          linkedCardType = linkedCard.type;
        }
      }

      await retroService.createAction(
        id, 
        text, 
        assignee, 
        cardId, 
        linkedCardContent, 
        linkedCardType
      );

      toast({
        title: "Action created",
        description: "New action item has been created",
      });
    } catch (error) {
      console.error("Error creating action:", error);
      toast({
        title: "Error",
        description: "Could not create action item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActionComplete = async (actionId: string) => {
    try {
      const actionToUpdate = actionItems.find(action => action.id === actionId);
      if (!actionToUpdate) return;

      await retroService.toggleActionComplete(actionId, actionToUpdate.completed);

      toast({
        title: `Action ${!actionToUpdate.completed ? "completed" : "reopened"}`,
        description: `The action item has been marked as ${!actionToUpdate.completed ? "completed" : "in progress"}`,
      });
    } catch (error) {
      console.error("Error toggling action completion:", error);
      toast({
        title: "Error",
        description: "Could not update action status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    try {
      await retroService.deleteAction(actionId);

      toast({
        title: "Action deleted",
        description: "The action item has been deleted",
      });
    } catch (error) {
      console.error("Error deleting action:", error);
      toast({
        title: "Error",
        description: "Could not delete action item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditComment = async (cardId: string, commentId: string, newContent: string) => {
    if (!newContent.trim()) return;

    try {
      await retroService.editComment(commentId, newContent);

      toast({
        title: "Commento aggiornato",
        description: "Il tuo commento è stato modificato",
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il commento. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (cardId: string, commentId: string) => {
    try {
      await retroService.deleteComment(commentId);

      toast({
        title: "Commento eliminato",
        description: "Il commento è stato eliminato",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il commento. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const handleCreateGroup = async (cardId: string, targetCardId: string) => {
    if (!retroData || !id) return;
    
    console.log(`Creating or updating group with cards: ${cardId} and ${targetCardId}`);
    
    try {
      const card = cards.find(c => c.id === cardId);
      const targetCard = cards.find(c => c.id === targetCardId);
      
      if (!card || !targetCard) {
        console.error("One or both cards not found", { cardId, targetCardId });
        toast({
          title: "Error",
          description: "Could not find the cards to group",
          variant: "destructive",
        });
        return;
      }
      
      if (card.groupId && card.groupId === targetCard.groupId) {
        console.log(`Card ${cardId} is already in the same group as ${targetCardId}`);
        return;
      }
      
      if (card.groupId && card.groupId !== targetCard.groupId) {
        console.log(`Removing card ${cardId} from previous group ${card.groupId}`);
        await handleRemoveCardFromGroup(cardId);
      }
      
      if (targetCard.groupId) {
        console.log(`Adding card ${cardId} to existing group ${targetCard.groupId}`);
        
        const existingGroupCards = cards.filter(c => c.groupId === targetCard.groupId);
        if (existingGroupCards.some(c => c.type !== card.type)) {
          toast({
            title: "Error",
            description: "Puoi raggruppare solo cards dello stesso tipo",
            variant: "destructive",
          });
          return;
        }
        
        await retroService.updateCardGroup(cardId, targetCard.groupId);
        
        toast({
          title: "Card aggiunta al gruppo",
          description: `Il gruppo contiene ora ${existingGroupCards.length + 1} cards`,
        });
      } 
      else {
        if (card.type !== targetCard.type) {
          toast({
            title: "Error",
            description: "Puoi raggruppare solo cards dello stesso tipo",
            variant: "destructive",
          });
          return;
        }

        const groupTitle = `${card.type.charAt(0).toUpperCase() + card.type.slice(1)} Group`;
        await retroService.createGroup(id, cardId, targetCardId, groupTitle);
        
        toast({
          title: "Nuovo gruppo creato",
          description: "Le cards sono state raggruppate insieme",
        });
      }
      
      // Refresh data
      await fetchCards();
      await fetchCardGroups();
    } catch (error) {
      console.error("Error grouping cards:", error);
      toast({
        title: "Error",
        description: `Failed to group cards: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleRemoveCardFromGroup = async (cardId: string) => {
    try {
      await retroService.removeCardFromGroup(cardId);

      toast({
        title: "Carta rimossa dal gruppo",
        description: "La carta è stata rimossa dal gruppo",
      });

      fetchCards();
      fetchCardGroups();
    } catch (error) {
      console.error("Error removing card from group:", error);
      toast({
        title: "Errore",
        description: "Impossibile rimuovere la carta dal gruppo. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const handleEditGroupTitle = async (groupId: string, newTitle: string) => {
    try {
      await retroService.editGroupTitle(groupId, newTitle);

      toast({
        title: "Titolo aggiornato",
        description: "Il titolo del gruppo è stato aggiornato",
      });

      fetchCardGroups();
    } catch (error) {
      console.error("Error updating group title:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il titolo. Riprova più tardi.",
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
      await fetchCards(); // Revert if error
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

  return {
    retroData,
    cards,
    cardGroups,
    votedCards,
    username,
    actionItems,
    handleAddCard,
    handleVote,
    handleAddComment,
    handleCreateAction,
    handleToggleActionComplete,
    handleDeleteAction,
    handleEditComment,
    handleDeleteComment,
    handleCreateGroup,
    handleRemoveCardFromGroup,
    handleEditGroupTitle,
    handleEditCard,
    handleDeleteCard,
  };
};
