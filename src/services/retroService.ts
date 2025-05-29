
import { RetroData, RetroCardType, CardGroup, ActionItemType, CardType } from '@/types/retro';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Check if we're in development and server is not available
const isServerAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(1000) // 1 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
};

// LocalStorage fallback functions
const getLocalRetros = (): Record<string, RetroData> => {
  const stored = localStorage.getItem('retroData');
  return stored ? JSON.parse(stored) : {};
};

const setLocalRetros = (retros: Record<string, RetroData>) => {
  localStorage.setItem('retroData', JSON.stringify(retros));
};

const getLocalCards = (retroId: string): any[] => {
  const stored = localStorage.getItem(`retroCards_${retroId}`);
  return stored ? JSON.parse(stored) : [];
};

const setLocalCards = (retroId: string, cards: any[]) => {
  localStorage.setItem(`retroCards_${retroId}`, JSON.stringify(cards));
};

const getLocalActions = (retroId: string): ActionItemType[] => {
  const stored = localStorage.getItem(`retroActions_${retroId}`);
  return stored ? JSON.parse(stored) : [];
};

const setLocalActions = (retroId: string, actions: ActionItemType[]) => {
  localStorage.setItem(`retroActions_${retroId}`, JSON.stringify(actions));
};

// Fetch basic retro data
export const fetchRetroData = async (retroId: string): Promise<RetroData | null> => {
  if (await isServerAvailable()) {
    const response = await fetch(`${API_BASE}/retro/${retroId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch retrospective data');
    }
    return response.json();
  } else {
    // Fallback to localStorage
    const retros = getLocalRetros();
    return retros[retroId] || null;
  }
};

// Fetch cards with comments and votes
export const fetchCards = async (retroId: string): Promise<any[]> => {
  if (await isServerAvailable()) {
    const response = await fetch(`${API_BASE}/retro/${retroId}/cards`);
    if (!response.ok) {
      throw new Error('Failed to fetch cards');
    }
    return response.json();
  } else {
    // Fallback to localStorage
    return getLocalCards(retroId);
  }
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
  if (await isServerAvailable()) {
    const response = await fetch(`${API_BASE}/retro/${retroId}/groups`);
    if (!response.ok) {
      throw new Error('Failed to fetch card groups');
    }
    return response.json();
  } else {
    // Fallback to localStorage
    return [];
  }
};

// Fetch action items
export const fetchActionItems = async (retroId: string): Promise<ActionItemType[]> => {
  if (await isServerAvailable()) {
    const response = await fetch(`${API_BASE}/retro/${retroId}/actions`);
    if (!response.ok) {
      throw new Error('Failed to fetch action items');
    }
    return response.json();
  } else {
    // Fallback to localStorage
    return getLocalActions(retroId);
  }
};

// Add a new card
export const addCard = async (retroId: string, content: string, type: CardType, author: string): Promise<void> => {
  if (await isServerAvailable()) {
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
  } else {
    // Fallback to localStorage
    const cards = getLocalCards(retroId);
    const newCard = {
      id: uuidv4(),
      retro_id: retroId,
      type,
      content: content.trim(),
      author,
      created_at: new Date().toISOString(),
      retro_comments: [],
      retro_card_votes: [],
      votes: 0,
      comments: []
    };
    cards.push(newCard);
    setLocalCards(retroId, cards);
  }
};

// Toggle vote on a card
export const toggleVote = async (cardId: string, username: string, hasVoted: boolean): Promise<void> => {
  if (await isServerAvailable()) {
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
  } else {
    // Fallback to localStorage - this is simplified
    console.log('Vote toggled locally for card:', cardId);
  }
};

// Add comment to card
export const addComment = async (cardId: string, content: string, author: string): Promise<void> => {
  if (await isServerAvailable()) {
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
  } else {
    // Fallback to localStorage - this is simplified
    console.log('Comment added locally for card:', cardId);
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
  if (await isServerAvailable()) {
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
  } else {
    // Fallback to localStorage
    const actions = getLocalActions(retroId);
    const newAction: ActionItemType = {
      id: uuidv4(),
      retro_id: retroId,
      text: text.trim(),
      assignee: assignee.trim() || null,
      completed: false,
      linked_card_id: cardId || null,
      linked_card_content: linkedCardContent || null,
      linked_card_type: linkedCardType || null,
      created_at: new Date().toISOString(),
    };
    actions.push(newAction);
    setLocalActions(retroId, actions);
  }
};

// Toggle action completion status
export const toggleActionComplete = async (actionId: string, currentStatus: boolean): Promise<void> => {
  if (await isServerAvailable()) {
    const response = await fetch(`${API_BASE}/actions/${actionId}/toggle`, {
      method: 'PUT',
    });
    
    if (!response.ok) {
      throw new Error('Failed to toggle action completion');
    }
  } else {
    // Fallback to localStorage - this is simplified
    console.log('Action completion toggled locally for action:', actionId);
  }
};

// Delete action item
export const deleteAction = async (actionId: string): Promise<void> => {
  if (await isServerAvailable()) {
    const response = await fetch(`${API_BASE}/actions/${actionId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete action');
    }
  } else {
    // Fallback to localStorage - this is simplified
    console.log('Action deleted locally:', actionId);
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
  if (await isServerAvailable()) {
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
  } else {
    // Fallback to localStorage
    const retros = getLocalRetros();
    const newRetro: RetroData = {
      ...retroData,
      created_at: new Date().toISOString(),
    };
    retros[retroData.id] = newRetro;
    setLocalRetros(retros);
    
    // Initialize empty cards and actions for this retro
    setLocalCards(retroData.id, []);
    setLocalActions(retroData.id, []);
  }
};

// Placeholder functions for features not yet implemented
export const editComment = async (commentId: string, newContent: string): Promise<void> => {
  console.warn('Edit comment not implemented yet');
};

export const deleteComment = async (commentId: string): Promise<void> => {
  console.warn('Delete comment not implemented yet');
};

export const createGroup = async (
  retroId: string,
  cardId: string, 
  targetCardId: string, 
  groupTitle: string
): Promise<string> => {
  console.warn('Create group not implemented yet');
  return uuidv4();
};

export const updateCardGroup = async (cardId: string, groupId: string): Promise<void> => {
  console.warn('Update card group not implemented yet');
};

export const removeCardFromGroup = async (cardId: string): Promise<void> => {
  console.warn('Remove card from group not implemented yet');
};

export const editGroupTitle = async (groupId: string, newTitle: string): Promise<void> => {
  console.warn('Edit group title not implemented yet');
};

export const editCard = async (cardId: string, newContent: string): Promise<void> => {
  console.warn('Edit card not implemented yet');
};

export const deleteCard = async (cardId: string): Promise<void> => {
  console.warn('Delete card not implemented yet');
};
