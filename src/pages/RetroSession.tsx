import React, { useState } from 'react';
import { useRetroSession } from '@/hooks/useRetroSession';
import RetroColumns from '@/components/RetroColumns';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, ThumbsDown, HeartHandshake } from 'lucide-react';
import { RetroCardType } from '@/hooks/useRetroSession';
import { CardType } from '@/components/RetroCard';

export const RetroSession = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    retroData,
    cards,
    cardGroups,
    votedCards,
    username,
    handleAddCard,
    handleVote,
    handleAddComment,
    handleCreateAction,
    handleEditComment,
    handleDeleteComment,
    handleCreateGroup,
    handleRemoveCardFromGroup,
    handleEditGroupTitle,
  } = useRetroSession();

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

  return (
    <div className="min-h-screen flex flex-col bg-pornoretro-black">
      <Header />

      <main className="flex-grow container mx-auto py-8 px-4">
        {retroData ? (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-pornoretro-orange">{retroData.name}</h1>
              <p className="text-xl text-white/75">Team: {retroData.team}</p>
              {retroData.is_anonymous && (
                <span className="inline-block bg-pornoretro-darkorange/40 text-pornoretro-orange px-3 py-1 rounded-full text-sm">
                  Feedback anonimo
                </span>
              )}
            </div>

            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 gap-2 bg-secondary/20">
                <TabsTrigger value="all" className="data-[state=active]:bg-pornoretro-orange data-[state=active]:text-pornoretro-black">
                  Tutte
                </TabsTrigger>
                <TabsTrigger value="hot" className="data-[state=active]:bg-green-600">Hot Moments</TabsTrigger>
                <TabsTrigger value="disappointment" className="data-[state=active]:bg-red-600">Disappointments</TabsTrigger>
                <TabsTrigger value="fantasy" className="data-[state=active]:bg-pornoretro-orange">Team Fantasy</TabsTrigger>
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
                    onCreateAction={handleCreateAction}
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
                    onCreateAction={handleCreateAction}
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
                    onCreateAction={handleCreateAction}
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
                    onCreateAction={handleCreateAction}
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
                    onCreateAction={handleCreateAction}
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
                    onCreateAction={handleCreateAction}
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
