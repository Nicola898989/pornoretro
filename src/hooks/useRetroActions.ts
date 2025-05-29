
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import * as retroService from '@/services/retroService';
import { ActionItemType, RetroCardType } from '@/types/retro';

export const useRetroActions = () => {
  const { toast } = useToast();
  const [actionItems, setActionItems] = useState<ActionItemType[]>([]);

  const fetchActionItems = async (retroId: string) => {
    try {
      const data = await retroService.fetchActionItems(retroId);
      setActionItems(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load action items",
        variant: "destructive",
      });
    }
  };

  const handleCreateAction = async (retroId: string, text: string, assignee: string, cardId: string | undefined, cards: RetroCardType[]) => {
    if (!text.trim()) {
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

      await retroService.createAction(
        retroId, 
        text, 
        assignee, 
        cardId, 
        linkedCardContent, 
        linkedCardType
      );

      toast({
        title: "Action created",
        description: "New action item has been created",
      });
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

      await retroService.toggleActionComplete(actionId, actionToUpdate.completed);

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
      await retroService.deleteAction(actionId);

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

  const insertAction = (newAction: ActionItemType) => {
    setActionItems(prev => [...prev, newAction]);
  };

  const updateAction = (updatedAction: ActionItemType) => {
    setActionItems(prev => 
      prev.map(action => action.id === updatedAction.id ? updatedAction : action)
    );
  };

  const deleteAction = (deletedAction: any) => {
    setActionItems(prev => prev.filter(action => action.id !== deletedAction.id));
  };

  return {
    actionItems,
    setActionItems,
    fetchActionItems,
    handleCreateAction,
    handleToggleActionComplete,
    handleDeleteAction,
    insertAction,
    updateAction,
    deleteAction,
  };
};
