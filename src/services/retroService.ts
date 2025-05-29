
import { RetroData, RetroCardType, CardGroup, ActionItemType, CardType } from '@/types/retro';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Fetch basic retro data
export const fetchRetroData = async (retroId: string): Promise<RetroData | null> => {
  const response = await fetch(`${API_BASE}/retro/${retroId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch retrospective data');
  }
  return response.json();
};

// Fetch cards with comments and votes
export const fetchCards = async (retroId: string): Promise<any[]> => {
  const response = await fetch(`${API_BASE}/retro/${retroId}/cards`);
  if (!response.ok) {
    throw new Error('Failed to fetch cards');
  }
  return response.json();
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
  const response = await fetch(`${API_BASE}/retro/${retroId}/groups`);
  if (!response.ok) {
    throw new Error('Failed to fetch card groups');
  }
  return response.json();
};

// Fetch action items
export const fetchActionItems = async (retroId: string): Promise<ActionItemType[]> => {
  const response = await fetch(`${API_BASE}/retro/${retroId}/actions`);
  if (!response.ok) {
    throw new Error('Failed to fetch action items');
  }
  return response.json();
};

// Add a new card
export const addCard = async (retroId: string, content: string, type: CardType, author: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/retro/${retroId}/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, content: content.trim(), author }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add card');
  }
};

// Toggle vote on a card
export const toggleVote = async (cardId: string, username: string, hasVoted: boolean): Promise<void> => {
  const response = await fetch(`${API_BASE}/cards/${cardId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: username }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to toggle vote');
  }
};

// Add comment to card
export const addComment = async (cardId: string, content: string, author: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/cards/${cardId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ author, content: content.trim() }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add comment');
  }
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
  const response = await fetch(`${API_BASE}/retro/${retroId}/actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text.trim(),
      assignee: assignee.trim() || null,
      linked_card_id: cardId || null,
      linked_card_content: linkedCardContent || null,
      linked_card_type: linkedCardType || null,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create action');
  }
};

// Toggle action completion status
export const toggleActionComplete = async (actionId: string, currentStatus: boolean): Promise<void> => {
  const response = await fetch(`${API_BASE}/actions/${actionId}/toggle`, {
    method: 'PUT',
  });
  
  if (!response.ok) {
    throw new Error('Failed to toggle action completion');
  }
};

// Delete action item
export const deleteAction = async (actionId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/actions/${actionId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete action');
  }
};

// Create retrospective
export const createRetro = async (retroData: {
  id: string;
  name: string;
  team: string;
  created_by: string;
  is_anonymous: boolean;
}): Promise<void> => {
  const response = await fetch(`${API_BASE}/retro`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(retroData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create retrospective');
  }
};

// Placeholder functions for features not yet implemented in the REST API
export const editComment = async (commentId: string, newContent: string): Promise<void> => {
  console.warn('Edit comment not implemented in REST API yet');
};

export const deleteComment = async (commentId: string): Promise<void> => {
  console.warn('Delete comment not implemented in REST API yet');
};

export const createGroup = async (
  retroId: string,
  cardId: string, 
  targetCardId: string, 
  groupTitle: string
): Promise<string> => {
  console.warn('Create group not implemented in REST API yet');
  return uuidv4();
};

export const updateCardGroup = async (cardId: string, groupId: string): Promise<void> => {
  console.warn('Update card group not implemented in REST API yet');
};

export const removeCardFromGroup = async (cardId: string): Promise<void> => {
  console.warn('Remove card from group not implemented in REST API yet');
};

export const editGroupTitle = async (groupId: string, newTitle: string): Promise<void> => {
  console.warn('Edit group title not implemented in REST API yet');
};

export const editCard = async (cardId: string, newContent: string): Promise<void> => {
  console.warn('Edit card not implemented in REST API yet');
};

export const deleteCard = async (cardId: string): Promise<void> => {
  console.warn('Delete card not implemented in REST API yet');
};
