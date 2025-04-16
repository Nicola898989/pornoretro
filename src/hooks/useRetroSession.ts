
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { CardType } from '@/components/RetroCard';

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

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUsername(storedUser);
    }

    if (id) {
      fetchRetroData();
      fetchCards();
      fetchCardGroups();
    }
  }, [id]);

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
      const { error } = await supabase
        .from('retro_cards')
        .insert({
          retro_id: id,
          type: type,
          content: content.trim(),
          author: retroData.is_anonymous ? 'Anonymous' : username,
        });

      if (error) throw error;

      toast({
        title: "Scheda aggiunta!",
        description: "La tua scheda è stata aggiunta alla retrospettiva",
      });

      fetchCards();
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

  const handleCreateAction = async (cardId: string) => {
    toast({
      title: "Feature in sviluppo",
      description: "La creazione di azioni sarà implementata presto",
    });
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

      fetchCards();
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

      fetchCards();
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
      
      // If target card is already in a group, add this card to that group
      if (targetCard.groupId) {
        console.log(`Adding card ${cardId} to existing group ${targetCard.groupId}`);
        
        // Check if the card types match
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
      // If neither card is in a group, create a new one
      else {
        // Check if the card types match
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
        
        // Update both cards with the new group ID
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

  return {
    retroData,
    cards,
    cardGroups,
    votedCards,
    username,
    handleAddCard,
    handleVote,
    handleAddComment,
    handleCreateAction,
    handleEditComment,
    handleDeleteComment,
    handleCreateGroup,
    handleRemoveCardFromGroup,
    handleEditGroupTitle,
  };
};

