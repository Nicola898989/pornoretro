
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RetroCard from "@/components/RetroCard";
import RetroCardGroup from "@/components/RetroCardGroup";

interface RetroData {
  id: string;
  name: string;
  team: string;
  created_by: string;
  created_at: string;
  is_anonymous?: boolean;
}

interface RetroCardType {
  id: string;
  type: 'hot' | 'disappointment' | 'fantasy';
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

interface CardGroup {
  id: string;
  retro_id: string;
  title: string;
  created_at: string;
}

const RetroSession = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [retroData, setRetroData] = useState<RetroData | null>(null);
  const [cards, setCards] = useState<RetroCardType[]>([]);
  const [cardGroups, setCardGroups] = useState<CardGroup[]>([]);
  const [votedCards, setVotedCards] = useState<Set<string>>(new Set());
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    if (id) {
      fetchRetroData();
      fetchCards();
      fetchCardGroups();
    }
  }, [id]);

  const handleCreateGroup = async (cardId: string, targetCardId: string) => {
    if (!retroData) return;
    
    console.log(`Creating group with cards: ${cardId} and ${targetCardId}`);
    
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
      
      console.log("Source card:", card);
      console.log("Target card:", targetCard);
      
      if (targetCard.groupId) {
        console.log(`Adding card ${cardId} to existing group ${targetCard.groupId}`);
        
        const { error } = await supabase
          .from('retro_cards')
          .update({ group_id: targetCard.groupId })
          .eq('id', cardId);
          
        if (error) {
          console.error("Error adding card to group:", error);
          toast({
            title: "Error",
            description: "Failed to group cards. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Cards grouped",
          description: "The card has been added to the existing group",
        });
        
        await fetchCards();
      } 
      else {
        const newGroupId = uuidv4();
        // Create a more descriptive title based on the cards being grouped
        const groupTitle = `${card.type.charAt(0).toUpperCase() + card.type.slice(1)} Group`;
        
        console.log(`Creating new group ${newGroupId} with title "${groupTitle}"`);
        
        const { error: groupError } = await supabase
          .from('retro_card_groups')
          .insert({
            id: newGroupId,
            retro_id: retroData.id,
            title: groupTitle
          });
          
        if (groupError) {
          console.error("Error creating group:", groupError);
          toast({
            title: "Error",
            description: "Failed to create group. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        const { error: card1Error } = await supabase
          .from('retro_cards')
          .update({ group_id: newGroupId })
          .eq('id', cardId);
          
        if (card1Error) {
          console.error("Error updating first card with group_id:", card1Error);
          toast({
            title: "Error",
            description: "Failed to add card to group. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        const { error: card2Error } = await supabase
          .from('retro_cards')
          .update({ group_id: newGroupId })
          .eq('id', targetCardId);
          
        if (card2Error) {
          console.error("Error updating second card with group_id:", card2Error);
          toast({
            title: "Error",
            description: "Failed to add card to group. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "New group created",
          description: "Cards have been grouped together",
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

    // Process the cards data to format it properly
    const processedCards = data.map(card => {
      const comments = (card.retro_comments || []).map(comment => ({
        id: comment.id,
        author: comment.author,
        content: comment.content,
        createdAt: comment.created_at
      }));

      // Count the votes
      const votes = (card.retro_card_votes || []).length;
      
      // Check if the current user has voted for this card
      const userVoted = card.retro_card_votes && card.retro_card_votes.some(vote => vote.user_id === username);
      if (userVoted) {
        setVotedCards(prev => new Set([...prev, card.id]));
      }

      return {
        id: card.id,
        type: card.type as 'hot' | 'disappointment' | 'fantasy',
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

  // Here would be the rest of the component with the render method
  return (
    <div>
      <h1>Retro Session: {retroData?.name}</h1>
      {/* Implementation of the component's UI would go here */}
      <pre>{JSON.stringify({cards, cardGroups}, null, 2)}</pre>
    </div>
  );
};

export default RetroSession;
