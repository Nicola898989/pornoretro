import React, { useState } from 'react';
import { useRetroSession } from '@/hooks/useRetroSession';
import { useRetroPresence } from '@/hooks/useRetroRealtime';
import RetroColumns from '@/components/RetroColumns';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, ThumbsDown, HeartHandshake, ClipboardCheck, Share2, Users } from 'lucide-react';
import { RetroCardType, ActionItemType, CardType } from '@/types/retro';
import ActionList from '@/components/ActionList';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ActionItemType as ComponentActionItemType } from '@/components/ActionItem';

// Helper function to convert between ActionItemType types
const convertActionItems = (items: ActionItemType[]): ComponentActionItemType[] => {
  return items.map(item => ({
    id: item.id,
    text: item.text,
    assignee: item.assignee,
    completed: item.completed,
    linked_card_id: item.linked_card_id,
    linked_card_content: item.linked_card_content,
    linked_card_type: item.linked_card_type as CardType | null
  }));
};

export const RetroSession = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  const {
    retroData,
    cards,
    cardGroups,
    votedCards,
    username,
    actionItems,
    handleAddCard,
    handleVote,
    handleAddComment,
    handleCreateAction,
    handleToggleActionComplete,
    handleDeleteAction,
    handleEditComment,
    handleDeleteComment,
    handleCreateGroup,
    handleRemoveCardFromGroup,
    handleEditGroupTitle,
    handleEditCard,
    handleDeleteCard,
    handleChangeCardCategory,
  } = useRetroSession();

  // Use the new presence hook
  const { activeUsers } = useRetroPresence(retroData?.id, username);

  // Group cards by type
  const hotCards = cards.filter(card => card.type === 'hot' && !card.groupId);
  const disappointmentCards = cards.filter(card => card.type === 'disappointment' && !card.groupId);
  const fantasyCards = cards.filter(card => card.type === 'fantasy' && !card.groupId);

  // Create map of group data
  const groupDataMap = new Map(cardGroups.map(group => [group.id, group]));
  
  // Create groupedCardsByGroup map where key is groupId and value is array of cards
  const groupedCardsByGroup = new Map<string, RetroCardType[]>();
  cards.filter(card => card.groupId).forEach(card => {
    if (!card.groupId) return;
    const existingCards = groupedCardsByGroup.get(card.groupId) || [];
    groupedCardsByGroup.set(card.groupId, [...existingCards, card]);
  });

  // Return cards and groups organized by card type
  const getGroupsForCardType = (type: 'hot' | 'disappointment' | 'fantasy') => {
    const result = [];
    
    for (const [groupId, groupCards] of groupedCardsByGroup.entries()) {
      const cardsOfType = groupCards.filter(card => card.type === type);
      if (cardsOfType.length > 0) {
        const group = groupDataMap.get(groupId);
        if (group) {
          result.push({
            group,
            cards: groupCards
          });
        }
      }
    }
    
    return result;
  };
  
  const hotGroups = getGroupsForCardType('hot');
  const disappointmentGroups = getGroupsForCardType('disappointment');
  const fantasyGroups = getGroupsForCardType('fantasy');

  const handleNewCard = async (content: string, type: CardType) => {
    setIsSubmitting(true);
    await handleAddCard(content, type);
    setIsSubmitting(false);
  };

  const handleCardAction = (cardId: string) => {
    setSelectedCardId(cardId);
    setShowActionDialog(true);
  };

  const handleShareRetro = () => {
    if (!retroData) return;
    
    const url = `${window.location.origin}/join?retro=${retroData.id}`;
    
    // Try to use the Clipboard API
    try {
      navigator.clipboard.writeText(url).then(() => {
        toast({
          title: "Link copiato negli appunti",
          description: "Puoi condividere il link con il tuo team"
        });
      });
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      
      toast({
        title: "Link copiato negli appunti",
        description: "Puoi condividere il link con il tuo team"
      });
    }
  };

  // Convert actionItems to ComponentActionItemType for the ActionList component
  const convertedActionItems = convertActionItems(actionItems);

  return (
    <div className="min-h-screen flex flex-col bg-pornoretro-black">
      <Header />

      <main className="flex-grow container mx-auto py-8 px-4">
        {retroData ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold text-pornoretro-orange">{retroData.name}</h1>
                <p className="text-xl text-white/75">Team: {retroData.team}</p>
                {retroData.is_anonymous && (
                  <span className="inline-block bg-pornoretro-darkorange/40 text-pornoretro-orange px-3 py-1 rounded-full text-sm">
                    Feedback anonimo
                  </span>
                )}
              </div>
              
              <div className="flex flex-col space-y-3">
                <div className="flex space-x-3 items-center">
                  <span className="flex items-center text-sm text-white/60">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{activeUsers.size} online</span>
                  </span>
                  
                  <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange flex"
                      >
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Action Items
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-pornoretro-black border-pornoretro-orange/30 max-w-xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-pornoretro-orange">Action Items</DialogTitle>
                      </DialogHeader>
                      <ActionList
                        actionItems={convertedActionItems}
                        onToggleComplete={handleToggleActionComplete}
                        onDelete={handleDeleteAction}
                        onAdd={handleCreateAction}
                        cards={cards}
                        selectedCardId={selectedCardId}
                      />
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    className="bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange flex"
                    onClick={handleShareRetro}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Condividi
                  </Button>
                </div>
                
                {activeUsers.size > 0 && (
                  <div className="flex -space-x-2 overflow-hidden">
                    {Array.from(activeUsers).map((user, i) => (
                      <div 
                        key={user} 
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-pornoretro-darkorange text-white border-2 border-pornoretro-black text-xs font-bold uppercase"
                        title={user}
                      >
                        {user.charAt(0)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 gap-2 bg-secondary/20">
                <TabsTrigger value="all" className="data-[state=active]:bg-pornoretro-orange data-[state=active]:text-pornoretro-black">
                  Tutte
                </TabsTrigger>
                <TabsTrigger value="hot" className="data-[state=active]:bg-green-600">Hot Moments</TabsTrigger>
                <TabsTrigger value="disappointment" className="data-[state=active]:bg-red-600">Disappointments</TabsTrigger>
                <TabsTrigger value="fantasy" className="data-[state=active]:bg-pornoretro-orange">Team Fantasy</TabsTrigger>
                <TabsTrigger value="actions" className="data-[state=active]:bg-blue-600">Action Items</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <RetroColumns
                    title="Hot Moments"
                    icon={<Flame className="mr-2" />}
                    count={hotCards.length + hotGroups.length}
                    className="text-green-500"
                    cards={hotCards}
                    groups={hotGroups}
                    onVote={handleVote}
                    onAddComment={handleAddComment}
                    onCreateAction={handleCardAction}
                    onEditComment={handleEditComment}
                    onDeleteComment={handleDeleteComment}
                    onDrop={handleCreateGroup}
                    onRemoveCardFromGroup={handleRemoveCardFromGroup}
                    onEditGroupTitle={handleEditGroupTitle}
                    votedCards={votedCards}
                    currentUser={username}
                    onAddCard={handleNewCard}
                    type="hot"
                    isSubmitting={isSubmitting}
                    onEditCard={handleEditCard}
                    onDeleteCard={handleDeleteCard}
                    onChangeCategory={handleChangeCardCategory}
                  />
                  
                  <RetroColumns
                    title="Disappointments"
                    icon={<ThumbsDown className="mr-2" />}
                    count={disappointmentCards.length + disappointmentGroups.length}
                    className="text-red-500"
                    cards={disappointmentCards}
                    groups={disappointmentGroups}
                    onVote={handleVote}
                    onAddComment={handleAddComment}
                    onCreateAction={handleCardAction}
                    onEditComment={handleEditComment}
                    onDeleteComment={handleDeleteComment}
                    onDrop={handleCreateGroup}
                    onRemoveCardFromGroup={handleRemoveCardFromGroup}
                    onEditGroupTitle={handleEditGroupTitle}
                    votedCards={votedCards}
                    currentUser={username}
                    onAddCard={handleNewCard}
                    type="disappointment"
                    isSubmitting={isSubmitting}
                    onEditCard={handleEditCard}
                    onDeleteCard={handleDeleteCard}
                    onChangeCategory={handleChangeCardCategory}
                  />
                  
                  <RetroColumns
                    title="Team Fantasy"
                    icon={<HeartHandshake className="mr-2" />}
                    count={fantasyCards.length + fantasyGroups.length}
                    className="text-pornoretro-orange"
                    cards={fantasyCards}
                    groups={fantasyGroups}
                    onVote={handleVote}
                    onAddComment={handleAddComment}
                    onCreateAction={handleCardAction}
                    onEditComment={handleEditComment}
                    onDeleteComment={handleDeleteComment}
                    onDrop={handleCreateGroup}
                    onRemoveCardFromGroup={handleRemoveCardFromGroup}
                    onEditGroupTitle={handleEditGroupTitle}
                    votedCards={votedCards}
                    currentUser={username}
                    onAddCard={handleNewCard}
                    type="fantasy"
                    isSubmitting={isSubmitting}
                    onEditCard={handleEditCard}
                    onDeleteCard={handleDeleteCard}
                    onChangeCategory={handleChangeCardCategory}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="hot" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <RetroColumns
                    title="Hot Moments"
                    icon={<Flame className="mr-2" />}
                    count={hotCards.length + hotGroups.length}
                    className="text-green-500"
                    cards={hotCards}
                    groups={hotGroups}
                    onVote={handleVote}
                    onAddComment={handleAddComment}
                    onCreateAction={handleCardAction}
                    onEditComment={handleEditComment}
                    onDeleteComment={handleDeleteComment}
                    onDrop={handleCreateGroup}
                    onRemoveCardFromGroup={handleRemoveCardFromGroup}
                    onEditGroupTitle={handleEditGroupTitle}
                    votedCards={votedCards}
                    currentUser={username}
                    onAddCard={handleNewCard}
                    type="hot"
                    isSubmitting={isSubmitting}
                    onEditCard={handleEditCard}
                    onDeleteCard={handleDeleteCard}
                    onChangeCategory={handleChangeCardCategory}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="disappointment" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <RetroColumns
                    title="Disappointments"
                    icon={<ThumbsDown className="mr-2" />}
                    count={disappointmentCards.length + disappointmentGroups.length}
                    className="text-red-500"
                    cards={disappointmentCards}
                    groups={disappointmentGroups}
                    onVote={handleVote}
                    onAddComment={handleAddComment}
                    onCreateAction={handleCardAction}
                    onEditComment={handleEditComment}
                    onDeleteComment={handleDeleteComment}
                    onDrop={handleCreateGroup}
                    onRemoveCardFromGroup={handleRemoveCardFromGroup}
                    onEditGroupTitle={handleEditGroupTitle}
                    votedCards={votedCards}
                    currentUser={username}
                    onAddCard={handleNewCard}
                    type="disappointment"
                    isSubmitting={isSubmitting}
                    onEditCard={handleEditCard}
                    onDeleteCard={handleDeleteCard}
                    onChangeCategory={handleChangeCardCategory}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="fantasy" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <RetroColumns
                    title="Team Fantasy"
                    icon={<HeartHandshake className="mr-2" />}
                    count={fantasyCards.length + fantasyGroups.length}
                    className="text-pornoretro-orange"
                    cards={fantasyCards}
                    groups={fantasyGroups}
                    onVote={handleVote}
                    onAddComment={handleAddComment}
                    onCreateAction={handleCardAction}
                    onEditComment={handleEditComment}
                    onDeleteComment={handleDeleteComment}
                    onDrop={handleCreateGroup}
                    onRemoveCardFromGroup={handleRemoveCardFromGroup}
                    onEditGroupTitle={handleEditGroupTitle}
                    votedCards={votedCards}
                    currentUser={username}
                    onAddCard={handleNewCard}
                    type="fantasy"
                    isSubmitting={isSubmitting}
                    onEditCard={handleEditCard}
                    onDeleteCard={handleDeleteCard}
                    onChangeCategory={handleChangeCardCategory}
                  />
                </div>
              </TabsContent>

              <TabsContent value="actions" className="mt-6">
                <div className="max-w-2xl mx-auto">
                  <ActionList
                    actionItems={convertedActionItems}
                    onToggleComplete={handleToggleActionComplete}
                    onDelete={handleDeleteAction}
                    onAdd={handleCreateAction}
                    cards={cards}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pornoretro-orange mx-auto mb-4"></div>
              <p className="text-white text-xl">Caricamento retrospettiva...</p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default RetroSession;
