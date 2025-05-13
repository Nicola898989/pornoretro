
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
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
  
  // Setup real-time subscriptions for all relevant tables
  useEffect(() => {
    if (!retroId) return;

    // Subscribe to retro cards changes
    const cardsChannel = supabase
      .channel('public:retro_cards')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'retro_cards',
        filter: `retro_id=eq.${retroId}`
      }, (payload) => {
        console.log('Received real-time card change:', payload);
        
        // Handle the different types of changes
        if (payload.eventType === 'INSERT') {
          handlers.onCardInsert(payload.new);
        } else if (payload.eventType === 'UPDATE') {
          handlers.onCardUpdate(payload.new);
        } else if (payload.eventType === 'DELETE') {
          handlers.onCardDelete(payload.old);
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
          handlers.onCommentChange();
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
        handlers.onVoteChange();
      })
      .subscribe();

    // Subscribe to card groups changes
    const groupsChannel = supabase
      .channel('public:retro_card_groups')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'retro_card_groups',
        filter: `retro_id=eq.${retroId}`
      }, (payload) => {
        console.log('Received real-time group change:', payload);
        
        if (payload.eventType === 'INSERT') {
          handlers.onCardGroupInsert(payload.new as CardGroup);
        } else if (payload.eventType === 'UPDATE') {
          handlers.onCardGroupUpdate(payload.new as CardGroup);
        } else if (payload.eventType === 'DELETE') {
          handlers.onCardGroupDelete(payload.old);
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
        filter: `retro_id=eq.${retroId}`
      }, (payload) => {
        console.log('Received real-time action change:', payload);
        
        if (payload.eventType === 'INSERT') {
          handlers.onActionInsert(payload.new as ActionItemType);
        } else if (payload.eventType === 'UPDATE') {
          handlers.onActionUpdate(payload.new as ActionItemType);
        } else if (payload.eventType === 'DELETE') {
          handlers.onActionDelete(payload.old);
        }
      })
      .subscribe();

    // Return a cleanup function
    return () => {
      supabase.removeAllChannels();
    };
  }, [retroId, handlers, toast]);

  return {
    // Track user presence separately
    trackUserPresence: async (retroId: string, username: string) => {
      if (!retroId || !username) return;
      
      const presenceChannel = supabase.channel(`presence-${retroId}`);
      
      await presenceChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            username,
            online_at: new Date().toISOString(),
          });
        }
      });
      
      return presenceChannel;
    }
  };
};

export const useRetroPresence = (retroId: string | undefined, username: string) => {
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (!retroId || !username) return;

    // Track active users in the retrospective
    const presenceChannel = supabase.channel(`presence-${retroId}`);
    
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = new Set<string>();
        
        Object.values(state).forEach((userList: any) => {
          userList.forEach((user: any) => {
            if (user.username) {
              users.add(user.username);
            }
          });
        });
        
        setActiveUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const joinedUsers = newPresences
          .filter((p: any) => p.username !== username)
          .map((p: any) => p.username);
        
        if (joinedUsers.length > 0) {
          toast({
            title: "Nuovo partecipante",
            description: `${joinedUsers.join(", ")} si è unito alla retrospettiva`,
          });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            username,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [retroId, username, toast]);

  return { activeUsers };
};
