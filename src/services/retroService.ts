
import { supabase } from "@/integrations/supabase/client";
import { RetroData, RetroCardType, CardGroup, ActionItemType, CardType } from '@/types/retro';
import { v4 as uuidv4 } from 'uuid';

// Fetch basic retro data
export const fetchRetroData = async (retroId: string): Promise<RetroData | null> => {
  const { data, error } = await supabase
    .from('retrospectives')
    .select('*')
    .eq('id', retroId)
    .single();

  if (error) {
    console.error('Error fetching retro data:', error);
    throw error;
  }

  return data;
};

// Fetch cards with comments and votes
export const fetchCards = async (retroId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('retro_cards')
    .select(`
      *,
      retro_comments(id, author, content, created_at),
      retro_card_votes(id, user_id)
    `)
    .eq('retro_id', retroId);

  if (error) {
    console.error('Error fetching cards:', error);
    throw error;
  }

  return data;
};

// Get user voted cards
export const getUserVotedCards = (cards: any[], username: string): Set<string> => {
  const votedCardIds = new Set<string>();
  
  cards.forEach(card => {
    if (card.retro_card_votes && card.retro_card_votes.some((vote: any) => vote.user_id === username)) {
      votedCardIds.add(card.id);
    }
  });
  
  return votedCardIds;
};

// Fetch card groups
export const fetchCardGroups = async (retroId: string): Promise<CardGroup[]> => {
  const { data, error } = await supabase
    .from('retro_card_groups')
    .select('*')
    .eq('retro_id', retroId);

  if (error) {
    console.error('Error fetching card groups:', error);
    throw error;
  }

  return data;
};

// Fetch action items
export const fetchActionItems = async (retroId: string): Promise<ActionItemType[]> => {
  const { data, error } = await supabase
    .from('retro_actions')
    .select('*')
    .eq('retro_id', retroId);

  if (error) {
    console.error('Error fetching action items:', error);
    throw error;
  }

  return data as ActionItemType[];
};

// Add a new card
export const addCard = async (retroId: string, content: string, type: CardType, author: string): Promise<void> => {
  const newCard = {
    retro_id: retroId,
    type: type,
    content: content.trim(),
    author: author,
  };
  
  const { error } = await supabase
    .from('retro_cards')
    .insert(newCard);

  if (error) throw error;
};

// Toggle vote on a card
export const toggleVote = async (cardId: string, username: string, hasVoted: boolean): Promise<void> => {
  if (hasVoted) {
    const { error } = await supabase
      .from('retro_card_votes')
      .delete()
      .match({ card_id: cardId, user_id: username });

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('retro_card_votes')
      .insert({
        card_id: cardId,
        user_id: username
      });

    if (error) throw error;
  }
};

// Add comment to card
export const addComment = async (cardId: string, content: string, author: string): Promise<void> => {
  const { error } = await supabase
    .from('retro_comments')
    .insert({
      card_id: cardId,
      author: author,
      content: content.trim()
    });

  if (error) throw error;
};

// Create action item
export const createAction = async (
  retroId: string, 
  text: string, 
  assignee: string, 
  cardId?: string,
  linkedCardContent?: string,
  linkedCardType?: string
): Promise<void> => {
  const { error } = await supabase
    .from('retro_actions')
    .insert({
      retro_id: retroId,
      text: text.trim(),
      assignee: assignee.trim() || null,
      linked_card_id: cardId || null,
      linked_card_content: linkedCardContent || null,
      linked_card_type: linkedCardType || null,
    });

  if (error) throw error;
};

// Toggle action completion status
export const toggleActionComplete = async (actionId: string, currentStatus: boolean): Promise<void> => {
  const { error } = await supabase
    .from('retro_actions')
    .update({ completed: !currentStatus })
    .eq('id', actionId);

  if (error) throw error;
};

// Delete action item
export const deleteAction = async (actionId: string): Promise<void> => {
  const { error } = await supabase
    .from('retro_actions')
    .delete()
    .eq('id', actionId);

  if (error) throw error;
};

// Edit comment
export const editComment = async (commentId: string, newContent: string): Promise<void> => {
  const { error } = await supabase
    .from('retro_comments')
    .update({ content: newContent.trim() })
    .eq('id', commentId);

  if (error) throw error;
};

// Delete comment
export const deleteComment = async (commentId: string): Promise<void> => {
  const { error } = await supabase
    .from('retro_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
};

// Create or update card grouping
export const createGroup = async (
  retroId: string,
  cardId: string, 
  targetCardId: string, 
  groupTitle: string
): Promise<string> => {
  const newGroupId = uuidv4();
    
  const { error: groupError } = await supabase
    .from('retro_card_groups')
    .insert({
      id: newGroupId,
      retro_id: retroId,
      title: groupTitle
    });
    
  if (groupError) throw groupError;
  
  const { error: cardsError } = await supabase
    .from('retro_cards')
    .update({ group_id: newGroupId })
    .in('id', [cardId, targetCardId]);
    
  if (cardsError) throw cardsError;
  
  return newGroupId;
};

// Update a card's group
export const updateCardGroup = async (cardId: string, groupId: string): Promise<void> => {
  const { error } = await supabase
    .from('retro_cards')
    .update({ group_id: groupId })
    .eq('id', cardId);
    
  if (error) throw error;
};

// Remove card from group
export const removeCardFromGroup = async (cardId: string): Promise<void> => {
  const { error } = await supabase
    .from('retro_cards')
    .update({ group_id: null })
    .eq('id', cardId);

  if (error) throw error;
};

// Edit group title
export const editGroupTitle = async (groupId: string, newTitle: string): Promise<void> => {
  const { error } = await supabase
    .from('retro_card_groups')
    .update({ title: newTitle })
    .eq('id', groupId);

  if (error) throw error;
};

// Edit card content
export const editCard = async (cardId: string, newContent: string): Promise<void> => {
  const { error } = await supabase
    .from('retro_cards')
    .update({ content: newContent.trim() })
    .eq('id', cardId);

  if (error) throw error;
};

// Delete card
export const deleteCard = async (cardId: string): Promise<void> => {
  const { error } = await supabase
    .from('retro_cards')
    .delete()
    .eq('id', cardId);

  if (error) throw error;
};
