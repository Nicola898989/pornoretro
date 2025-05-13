
export type CardType = 'hot' | 'disappointment' | 'fantasy';

export interface RetroData {
  id: string;
  name: string;
  team: string;
  created_by: string;
  created_at: string;
  is_anonymous?: boolean;
}

export interface RetroCardComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface RetroCardType {
  id: string;
  type: CardType;
  content: string;
  author: string;
  votes: number;
  comments: RetroCardComment[];
  groupId?: string;
  // Adding these properties to match the server response
  retro_comments?: any[];
  retro_card_votes?: any[];
  group_id?: string;
}

export interface CardGroup {
  id: string;
  retro_id: string;
  title: string;
  created_at: string;
}

export interface ActionItemType {
  id: string;
  retro_id: string;
  text: string;
  assignee: string | null;
  completed: boolean;
  linked_card_id: string | null;
  linked_card_content: string | null;
  linked_card_type: string | null;
  created_at: string;
}
