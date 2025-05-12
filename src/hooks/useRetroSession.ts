
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { CardType } from '@/components/RetroCard';
import { ActionItemType } from '@/components/ActionItem';

export interface RetroData {
  id: string;
  name: string;
  team: string;
  created_by: string;
  created_at: string;
  is_anonymous?: boolean;
}

export interface RetroCardType {
  id: string;
  type: CardType;
  content: string;
  author: string;
  votes: number;
  comments: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: string;
  }>;
  groupId?: string;
}

export interface CardGroup {
  id: string;
  retro_id: string;
  title: string;
  created_at: string;
}

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

      // Set up real-time subscriptions
      setupRealtimeSubscriptions();
    }

    return () => {
      // Cleanup subscriptions on unmount
      cleanupRealtimeSubscriptions();
    };
  }, [id]);

  // Setup real-time subscriptions for all relevant tables
  const setupRealtimeSubscriptions = () => {
    if (!id) return;

    // Subscribe to retro cards changes
    const cardsChannel = supabase
      .channel('public:retro_cards')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'retro_cards',
        filter: `retro_id=eq.${id}`
      }, (payload) => {
        console.log('Received real-time card change:', payload);
        
        // Handle the different types of changes
        if (payload.eventType === 'INSERT') {
          handleRealtimeCardInsert(payload.new);
        } else if (payload.eventType === 'UPDATE') {
          handleRealtimeCardUpdate(payload.new);
        } else if (payload.eventType === 'DELETE') {
          handleRealtimeCardDelete(payload.old);
        }
      })
      .subscribe();

    // Subscribe to comments changes
    const commentsChannel = supabase
      .channel('public:retro_comments')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'retro_comments'
      }, (payload) => {
        console.log('Received real-time comment change:', payload);
        // When comments change, refresh cards to get updated comments
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          fetchCards();
        }
      })
      .subscribe();

    // Subscribe to votes changes
    const votesChannel = supabase
      .channel('public:retro_card_votes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'retro_card_votes'
      }, (payload) => {
        console.log('Received real-time vote change:', payload);
        // When votes change, refresh cards to get updated vote counts
        fetchCards();
      })
      .subscribe();

    // Subscribe to card groups changes
    const groupsChannel = supabase
      .channel('public:retro_card_groups')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'retro_card_groups',
        filter: `retro_id=eq.${id}`
      }, (payload) => {
        console.log('Received real-time group change:', payload);
        
        if (payload.eventType === 'INSERT') {
          // Ensure we cast the new data to CardGroup type
          setCardGroups(prev => [...prev, payload.new as CardGroup]);
        } else if (payload.eventType === 'UPDATE') {
          setCardGroups(prev => 
            prev.map(group => group.id === payload.new.id ? payload.new as CardGroup : group)
          );
        } else if (payload.eventType === 'DELETE') {
          setCardGroups(prev => 
            prev.filter(group => group.id !== payload.old.id)
          );
        }
      })
      .subscribe();

    // Subscribe to action items changes
    const actionsChannel = supabase
      .channel('public:retro_actions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'retro_actions',
        filter: `retro_id=eq.${id}`
      }, (payload) => {
        console.log('Received real-time action change:', payload);
        
        if (payload.eventType === 'INSERT') {
          // Ensure we cast the new data to ActionItemType
          setActionItems(prev => [...prev, payload.new as ActionItemType]);
        } else if (payload.eventType === 'UPDATE') {
          setActionItems(prev => 
            prev.map(action => action.id === payload.new.id ? payload.new as ActionItemType : action)
          );
        } else if (payload.eventType === 'DELETE') {
          setActionItems(prev => 
            prev.filter(action => action.id !== payload.old.id)
          );
        }
      })
      .subscribe();

    // Store channel references for cleanup
    return { cardsChannel, commentsChannel, votesChannel, groupsChannel, actionsChannel };
  };

  // Cleanup function for real-time subscriptions
  const cleanupRealtimeSubscriptions = () => {
    supabase.removeAllChannels();
  };

  // Handle real-time card insert
  const handleRealtimeCardInsert = (newCard: any) => {
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
  };

  // Handle real-time card update
  const handleRealtimeCardUpdate = (updatedCard: any) => {
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
  };

  // Handle real-time card delete
  const handleRealtimeCardDelete = (deletedCard: any) => {
    setCards(prev => prev.filter(card => card.id !== deletedCard.id));
  };

  const fetchRetroData = async () => {
    const { data, error } = await supabase
      .from('retrospectives')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching retro data:', error);
      toast({
        title: "Error",
        description: "Could not load retrospective data",
        variant: "destructive",
      });
      return;
    }

    setRetroData(data);
  };

  const fetchCards = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from('retro_cards')
      .select(`
        *,
        retro_comments(id, author, content, created_at),
        retro_card_votes(id, user_id)
      `)
      .eq('retro_id', id);

    if (error) {
      console.error('Error fetching cards:', error);
      toast({
        title: "Error",
        description: "Could not load retrospective cards",
        variant: "destructive",
      });
      return;
    }

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
  };

  const fetchCardGroups = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from('retro_card_groups')
      .select('*')
      .eq('retro_id', id);

    if (error) {
      console.error('Error fetching card groups:', error);
      toast({
        title: "Error",
        description: "Could not load card groups",
        variant: "destructive",
      });
      return;
    }

    setCardGroups(data);
  };

  const fetchActionItems = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from('retro_actions')
      .select('*')
      .eq('retro_id', id);

    if (error) {
      console.error('Error fetching action items:', error);
      toast({
        title: "Error",
        description: "Could not load action items",
        variant: "destructive",
      });
      return;
    }

    setActionItems(data as ActionItemType[]);
  };

  const handleAddCard = async (content: string, type: CardType) => {
    if (!content.trim() || !username || !retroData) {
      toast({
        title: "Impossibile aggiungere la scheda",
        description: "Per favore, inserisci un contenuto valido",
        variant: "destructive",
      });
      return;
    }

    try {
      const newCard = {
        retro_id: id,
        type: type,
        content: content.trim(),
        author: retroData.is_anonymous ? 'Anonymous' : username,
      };
      
      const { error } = await supabase
        .from('retro_cards')
        .insert(newCard);

      if (error) throw error;

      // We don't need to update local state directly as the real-time subscription will handle it
      // This avoids duplicate cards in the UI
      
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
      if (hasVoted) {
        const { error } = await supabase
          .from('retro_card_votes')
          .delete()
          .match({ card_id: cardId, user_id: username });

        if (error) throw error;

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
        const { error } = await supabase
          .from('retro_card_votes')
          .insert({
            card_id: cardId,
            user_id: username
          });

        if (error) throw error;

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
      const { error } = await supabase
        .from('retro_comments')
        .insert({
          card_id: cardId,
          author: retroData.is_anonymous ? 'Anonymous' : username,
          content: content.trim()
        });

      if (error) throw error;

      toast({
        title: "Commento aggiunto",
        description: "Il tuo commento è stato aggiunto",
      });

      fetchCards();
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

      const { error } = await supabase
        .from('retro_actions')
        .insert({
          retro_id: id,
          text: text.trim(),
          assignee: assignee.trim() || null,
          linked_card_id: cardId || null,
          linked_card_content: linkedCardContent || null,
          linked_card_type: linkedCardType || null,
        });

      if (error) throw error;

      toast({
        title: "Action created",
        description: "New action item has been created",
      });

      fetchActionItems();
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

      const { error } = await supabase
        .from('retro_actions')
        .update({ completed: !actionToUpdate.completed })
        .eq('id', actionId);

      if (error) throw error;

      setActionItems(prevItems => 
        prevItems.map(item => 
          item.id === actionId 
            ? { ...item, completed: !item.completed } 
            : item
        )
      );

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
      const { error } = await supabase
        .from('retro_actions')
        .delete()
        .eq('id', actionId);

      if (error) throw error;

      setActionItems(prevItems => prevItems.filter(item => item.id !== actionId));

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
      const { error } = await supabase
        .from('retro_comments')
        .update({ content: newContent.trim() })
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Commento aggiornato",
        description: "Il tuo commento è stato modificato",
      });

      // Real-time subscription will update UI
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
      const { error } = await supabase
        .from('retro_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Commento eliminato",
        description: "Il commento è stato eliminato",
      });

      // Real-time subscription will update UI
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
    if (!retroData) return;
    
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
        
        const { error } = await supabase
          .from('retro_cards')
          .update({ group_id: targetCard.groupId })
          .eq('id', cardId);
          
        if (error) throw error;
        
        toast({
          title: "Card aggiunta al gruppo",
          description: `Il gruppo contiene ora ${existingGroupCards.length + 1} cards`,
        });
        
        await fetchCards();
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

        const newGroupId = uuidv4();
        const groupTitle = `${card.type.charAt(0).toUpperCase() + card.type.slice(1)} Group`;
        
        const { error: groupError } = await supabase
          .from('retro_card_groups')
          .insert({
            id: newGroupId,
            retro_id: retroData.id,
            title: groupTitle
          });
          
        if (groupError) throw groupError;
        
        const { error: cardsError } = await supabase
          .from('retro_cards')
          .update({ group_id: newGroupId })
          .in('id', [cardId, targetCardId]);
          
        if (cardsError) throw cardsError;
        
        toast({
          title: "Nuovo gruppo creato",
          description: "Le cards sono state raggruppate insieme",
        });
        
        await fetchCards();
        await fetchCardGroups();
      }
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
      const { error } = await supabase
        .from('retro_cards')
        .update({ group_id: null })
        .eq('id', cardId);

      if (error) throw error;

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
      const { error } = await supabase
        .from('retro_card_groups')
        .update({ title: newTitle })
        .eq('id', groupId);

      if (error) throw error;

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

      const { error } = await supabase
        .from('retro_cards')
        .update({ content: newContent.trim() })
        .eq('id', cardId);

      if (error) {
        await fetchCards(); // Revert if error
        throw error;
      }

      toast({
        title: "Card aggiornata",
        description: "Il contenuto della card è stato aggiornato",
      });

      // Real-time subscription will update UI for other users
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
      const { error } = await supabase
        .from('retro_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      toast({
        title: "Card eliminata",
        description: "La card è stata eliminata con successo",
      });

      // Real-time subscription will update UI
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
