import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { useRetroRealtime } from './useRetroRealtime';
import { useRetroCards } from './useRetroCards';
import { useRetroComments } from './useRetroComments';
import { useRetroCardGroups } from './useRetroCardGroups';
import { useRetroActions } from './useRetroActions';
import * as retroService from '@/services/retroService';
import { RetroData, CardType } from '@/types/retro';

// Use proper syntax for re-exporting types with isolatedModules enabled
export type { RetroData, CardType };

export const useRetroSession = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [retroData, setRetroData] = useState<RetroData | null>(null);
  const [username, setUsername] = useState<string>("");

  // Use the smaller hooks
  const cardHook = useRetroCards();
  const commentHook = useRetroComments();
  const groupHook = useRetroCardGroups();
  const actionHook = useRetroActions();

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUsername(storedUser);
    }

    if (id) {
      fetchRetroData();
      cardHook.fetchCards(id);
      groupHook.fetchCardGroups(id);
      actionHook.fetchActionItems(id);
    }
  }, [id]);

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

  // Set up real-time subscriptions
  const realtimeHandlers = {
    onCardInsert: (newCard: any) => {
      cardHook.insertCard(newCard, username, retroData);
      
      // Notify user about new card (optional)
      toast({
        title: "Nuova scheda aggiunta",
        description: `${newCard.author} ha aggiunto una nuova scheda`,
      });
    },
    onCardUpdate: (updatedCard: any) => {
      cardHook.updateCard(updatedCard);
    },
    onCardDelete: (deletedCard: any) => {
      cardHook.deleteCard(deletedCard);
    },
    onCardGroupInsert: (newGroup: any) => {
      groupHook.insertCardGroup(newGroup);
    },
    onCardGroupUpdate: (updatedGroup: any) => {
      groupHook.updateCardGroup(updatedGroup);
    },
    onCardGroupDelete: (deletedGroup: any) => {
      groupHook.deleteCardGroup(deletedGroup);
    },
    onActionInsert: (newAction: any) => {
      actionHook.insertAction(newAction);
    },
    onActionUpdate: (updatedAction: any) => {
      actionHook.updateAction(updatedAction);
    },
    onActionDelete: (deletedAction: any) => {
      actionHook.deleteAction(deletedAction);
    },
    onCommentChange: () => id && cardHook.fetchCards(id),
    onVoteChange: () => id && cardHook.fetchCards(id),
    username
  };
  
  useRetroRealtime(id, realtimeHandlers);

  // Wrapper functions to pass the required parameters
  const handleAddCard = (content: string, type: CardType) => {
    if (!id || !retroData) return;
    return cardHook.handleAddCard(id, content, type, retroData, username);
  };

  const handleVote = (cardId: string) => {
    return cardHook.handleVote(cardId, username);
  };

  const handleAddComment = (cardId: string, content: string) => {
    return commentHook.handleAddComment(cardId, content, username, retroData);
  };

  const handleCreateAction = (text: string, assignee: string, cardId?: string) => {
    if (!id) return;
    return actionHook.handleCreateAction(id, text, assignee, cardId, cardHook.cards);
  };

  const handleCreateGroup = (cardId: string, targetCardId: string) => {
    if (!id) return;
    const onCardUpdate = () => cardHook.fetchCards(id);
    return groupHook.handleCreateGroup(id, cardId, targetCardId, cardHook.cards, onCardUpdate);
  };

  const handleRemoveCardFromGroup = (cardId: string) => {
    const onCardUpdate = () => id ? cardHook.fetchCards(id) : Promise.resolve();
    return groupHook.handleRemoveCardFromGroup(cardId, onCardUpdate);
  };

  const handleEditGroupTitle = (groupId: string, newTitle: string) => {
    groupHook.handleEditGroupTitle(groupId, newTitle);
    if (id) groupHook.fetchCardGroups(id);
  };

  const handleChangeCardCategory = (cardId: string, newType: CardType) => {
    return cardHook.handleChangeCardCategory(cardId, newType);
  };

  return {
    retroData,
    cards: cardHook.cards,
    cardGroups: groupHook.cardGroups,
    votedCards: cardHook.votedCards,
    username,
    actionItems: actionHook.actionItems,
    handleAddCard,
    handleVote,
    handleAddComment,
    handleCreateAction,
    handleToggleActionComplete: actionHook.handleToggleActionComplete,
    handleDeleteAction: actionHook.handleDeleteAction,
    handleEditComment: commentHook.handleEditComment,
    handleDeleteComment: commentHook.handleDeleteComment,
    handleCreateGroup,
    handleRemoveCardFromGroup,
    handleEditGroupTitle,
    handleEditCard: cardHook.handleEditCard,
    handleDeleteCard: cardHook.handleDeleteCard,
    handleChangeCardCategory,
  };
};
