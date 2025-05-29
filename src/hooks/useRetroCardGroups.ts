
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import * as retroService from '@/services/retroService';
import { CardGroup, RetroCardType } from '@/types/retro';

export const useRetroCardGroups = () => {
  const { toast } = useToast();
  const [cardGroups, setCardGroups] = useState<CardGroup[]>([]);

  const fetchCardGroups = async (retroId: string) => {
    try {
      const data = await retroService.fetchCardGroups(retroId);
      setCardGroups(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load card groups",
        variant: "destructive",
      });
    }
  };

  const handleCreateGroup = async (
    retroId: string,
    cardId: string, 
    targetCardId: string,
    cards: RetroCardType[],
    onCardUpdate: () => Promise<void>
  ) => {
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
      
      if (card.groupId && card.groupId === targetCard.groupId) {
        console.log(`Card ${cardId} is already in the same group as ${targetCardId}`);
        return;
      }
      
      if (card.groupId && card.groupId !== targetCard.groupId) {
        console.log(`Removing card ${cardId} from previous group ${card.groupId}`);
        await handleRemoveCardFromGroup(cardId, onCardUpdate);
      }
      
      if (targetCard.groupId) {
        console.log(`Adding card ${cardId} to existing group ${targetCard.groupId}`);
        
        const existingGroupCards = cards.filter(c => c.groupId === targetCard.groupId);
        if (existingGroupCards.some(c => c.type !== card.type)) {
          toast({
            title: "Error",
            description: "Puoi raggruppare solo cards dello stesso tipo",
            variant: "destructive",
          });
          return;
        }
        
        await retroService.updateCardGroup(cardId, targetCard.groupId);
        
        toast({
          title: "Card aggiunta al gruppo",
          description: `Il gruppo contiene ora ${existingGroupCards.length + 1} cards`,
        });
      } 
      else {
        if (card.type !== targetCard.type) {
          toast({
            title: "Error",
            description: "Puoi raggruppare solo cards dello stesso tipo",
            variant: "destructive",
          });
          return;
        }

        const groupTitle = `${card.type.charAt(0).toUpperCase() + card.type.slice(1)} Group`;
        await retroService.createGroup(retroId, cardId, targetCardId, groupTitle);
        
        toast({
          title: "Nuovo gruppo creato",
          description: "Le cards sono state raggruppate insieme",
        });
      }
      
      // Refresh data
      await onCardUpdate();
      await fetchCardGroups(retroId);
    } catch (error) {
      console.error("Error grouping cards:", error);
      toast({
        title: "Error",
        description: `Failed to group cards: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleRemoveCardFromGroup = async (cardId: string, onCardUpdate: () => Promise<void>) => {
    try {
      await retroService.removeCardFromGroup(cardId);

      toast({
        title: "Carta rimossa dal gruppo",
        description: "La carta è stata rimossa dal gruppo",
      });

      await onCardUpdate();
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
      await retroService.editGroupTitle(groupId, newTitle);

      toast({
        title: "Titolo aggiornato",
        description: "Il titolo del gruppo è stato aggiornato",
      });
    } catch (error) {
      console.error("Error updating group title:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il titolo. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const insertCardGroup = (newGroup: CardGroup) => {
    setCardGroups(prev => [...prev, newGroup]);
  };

  const updateCardGroup = (updatedGroup: CardGroup) => {
    setCardGroups(prev => 
      prev.map(group => group.id === updatedGroup.id ? updatedGroup : group)
    );
  };

  const deleteCardGroup = (deletedGroup: any) => {
    setCardGroups(prev => prev.filter(group => group.id !== deletedGroup.id));
  };

  return {
    cardGroups,
    setCardGroups,
    fetchCardGroups,
    handleCreateGroup,
    handleRemoveCardFromGroup,
    handleEditGroupTitle,
    insertCardGroup,
    updateCardGroup,
    deleteCardGroup,
  };
};
