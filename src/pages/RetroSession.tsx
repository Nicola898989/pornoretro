
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
