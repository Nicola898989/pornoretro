import { useEffect } from 'react';
import { useRetroSocket } from './useSocket';
import { RetroCardType, ActionItemType, CardGroup } from '@/types/retro';
import { useToast } from "@/hooks/use-toast";

type RealtimeHandlers = {
  onCardInsert: (card: any) => void;
  onCardUpdate: (card: any) => void;
  onCardDelete: (card: any) => void;
  onCardGroupInsert: (group: CardGroup) => void;
  onCardGroupUpdate: (group: CardGroup) => void;
  onCardGroupDelete: (group: any) => void;
  onActionInsert: (action: ActionItemType) => void;
  onActionUpdate: (action: ActionItemType) => void;
  onActionDelete: (action: any) => void;
  onCommentChange: () => void;
  onVoteChange: () => void;
  username: string;
}

export const useRetroRealtime = (retroId: string | undefined, handlers: RealtimeHandlers) => {
  const { toast } = useToast();
  
  const socketHandlers = {
    onCardAdded: (card: any) => {
      if (card.author !== handlers.username) {
        toast({
          title: "Nuova scheda aggiunta",
          description: `${card.author} ha aggiunto una nuova scheda`,
        });
      }
      handlers.onCardInsert(card);
    },
    onVoteChanged: () => {
      handlers.onVoteChange();
    },
    onCommentAdded: () => {
      handlers.onCommentChange();
    },
    onActionAdded: (action: any) => {
      handlers.onActionInsert(action);
    },
    onActionUpdated: (action: any) => {
      handlers.onActionUpdate(action);
    },
    onActionDeleted: (action: any) => {
      handlers.onActionDelete(action);
    }
  };

  useRetroSocket(retroId, socketHandlers);

  return {
    trackUserPresence: async (retroId: string, username: string) => {
      // Placeholder for user presence tracking
      console.log(`Tracking presence for ${username} in ${retroId}`);
    }
  };
};

export const useRetroPresence = (retroId: string | undefined, username: string) => {
  // Simplified presence tracking without Supabase
  return { activeUsers: new Set([username]) };
};
