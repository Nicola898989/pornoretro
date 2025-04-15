
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RetroCard from "@/components/RetroCard";
import RetroCardGroup from "@/components/RetroCardGroup";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, ThumbsUp, MessageCircle, Flame, ThumbsDown, HeartHandshake } from "lucide-react";

interface RetroData {
  id: string;
  name: string;
  team: string;
  created_by: string;
  created_at: string;
  is_anonymous?: boolean;
}

interface RetroCardType {
  id: string;
  type: 'hot' | 'disappointment' | 'fantasy';
  content: string;
  author: string;
  votes: number;
  comments: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: string;
  }>;
  groupId?: string;
}

interface CardGroup {
  id: string;
  retro_id: string;
  title: string;
  created_at: string;
}

const RetroSession = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [retroData, setRetroData] = useState<RetroData | null>(null);
  const [cards, setCards] = useState<RetroCardType[]>([]);
  const [cardGroups, setCardGroups] = useState<CardGroup[]>([]);
  const [votedCards, setVotedCards] = useState<Set<string>>(new Set());
  const [username, setUsername] = useState<string>("");
  const [newCardContent, setNewCardContent] = useState("");
  const [newCardType, setNewCardType] = useState<'hot' | 'disappointment' | 'fantasy'>('hot');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Try to get username from localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUsername(storedUser);
    }

    if (id) {
      fetchRetroData();
      fetchCards();
      fetchCardGroups();
    }
  }, [id]);

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

  const fetchRetroData = async () => {
    const { data, error } = await supabase
      .from('retrospectives')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching retro data:', error);
      toast({
        title: "Error",
        description: "Could not load retrospective data",
        variant: "destructive",
      });
      return;
    }

    setRetroData(data);
  };

  const fetchCards = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from('retro_cards')
      .select(`
        *,
        retro_comments(id, author, content, created_at),
        retro_card_votes(id, user_id)
      `)
      .eq('retro_id', id);

    if (error) {
      console.error('Error fetching cards:', error);
      toast({
        title: "Error",
        description: "Could not load retrospective cards",
        variant: "destructive",
      });
      return;
    }

    // Process the cards data to format it properly
    const processedCards = data.map(card => {
      const comments = (card.retro_comments || []).map(comment => ({
        id: comment.id,
        author: comment.author,
        content: comment.content,
        createdAt: comment.created_at
      }));

      // Count the votes
      const votes = (card.retro_card_votes || []).length;
      
      // Check if the current user has voted for this card
      const userVoted = card.retro_card_votes && card.retro_card_votes.some(vote => vote.user_id === username);
      if (userVoted) {
        setVotedCards(prev => new Set([...prev, card.id]));
      }

      return {
        id: card.id,
        type: card.type as 'hot' | 'disappointment' | 'fantasy',
        content: card.content,
        author: card.author,
        votes,
        comments,
        groupId: card.group_id || undefined
      };
    });

    setCards(processedCards);
  };

  const fetchCardGroups = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from('retro_card_groups')
      .select('*')
      .eq('retro_id', id);

    if (error) {
      console.error('Error fetching card groups:', error);
      toast({
        title: "Error",
        description: "Could not load card groups",
        variant: "destructive",
      });
      return;
    }

    setCardGroups(data);
  };

  const handleAddCard = async () => {
    if (!newCardContent.trim() || !username || !retroData) {
      toast({
        title: "Impossibile aggiungere la scheda",
        description: "Per favore, inserisci un contenuto valido",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('retro_cards')
        .insert({
          retro_id: id,
          type: newCardType,
          content: newCardContent.trim(),
          author: retroData.is_anonymous ? 'Anonymous' : username,
        })
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Scheda aggiunta!",
        description: "La tua scheda è stata aggiunta alla retrospettiva",
      });

      setNewCardContent("");
      fetchCards(); // Refresh cards
    } catch (error) {
      console.error("Error adding card:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere la scheda. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (cardId: string) => {
    if (!username) return;

    const hasVoted = votedCards.has(cardId);

    try {
      if (hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from('retro_card_votes')
          .delete()
          .match({ card_id: cardId, user_id: username });

        if (error) throw error;

        setVotedCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(cardId);
          return newSet;
        });

        toast({
          title: "Voto rimosso",
          description: "Il tuo voto è stato rimosso",
        });
      } else {
        // Add vote
        const { error } = await supabase
          .from('retro_card_votes')
          .insert({
            card_id: cardId,
            user_id: username
          });

        if (error) throw error;

        setVotedCards(prev => new Set([...prev, cardId]));

        toast({
          title: "Voto aggiunto!",
          description: "Il tuo voto è stato registrato",
        });
      }

      // Refresh cards to update vote count
      fetchCards();
    } catch (error) {
      console.error("Error toggling vote:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il voto. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (cardId: string, content: string) => {
    if (!content.trim() || !username || !retroData) return;

    try {
      const { error } = await supabase
        .from('retro_comments')
        .insert({
          card_id: cardId,
          author: retroData.is_anonymous ? 'Anonymous' : username,
          content: content.trim()
        });

      if (error) throw error;

      toast({
        title: "Commento aggiunto",
        description: "Il tuo commento è stato aggiunto",
      });

      // Refresh cards to show new comment
      fetchCards();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il commento. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const handleCreateAction = async (cardId: string) => {
    // This will be implemented later
    toast({
      title: "Feature in sviluppo",
      description: "La creazione di azioni sarà implementata presto",
    });
  };

  const handleEditComment = async (cardId: string, commentId: string, newContent: string) => {
    if (!newContent.trim()) return;

    try {
      const { error } = await supabase
        .from('retro_comments')
        .update({ content: newContent.trim() })
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Commento aggiornato",
        description: "Il tuo commento è stato modificato",
      });

      // Refresh cards to show updated comment
      fetchCards();
    } catch (error) {
      console.error("Error updating comment:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il commento. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (cardId: string, commentId: string) => {
    try {
      const { error } = await supabase
        .from('retro_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Commento eliminato",
        description: "Il commento è stato eliminato",
      });

      // Refresh cards to remove deleted comment
      fetchCards();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il commento. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCardFromGroup = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('retro_cards')
        .update({ group_id: null })
        .eq('id', cardId);

      if (error) throw error;

      toast({
        title: "Carta rimossa dal gruppo",
        description: "La carta è stata rimossa dal gruppo",
      });

      // Refresh cards
      fetchCards();
      fetchCardGroups();
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
      const { error } = await supabase
        .from('retro_card_groups')
        .update({ title: newTitle })
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: "Titolo aggiornato",
        description: "Il titolo del gruppo è stato aggiornato",
      });

      fetchCardGroups();
    } catch (error) {
      console.error("Error updating group title:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il titolo. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  // Group cards by type
  const hotCards = cards.filter(card => card.type === 'hot' && !card.groupId);
  const disappointmentCards = cards.filter(card => card.type === 'disappointment' && !card.groupId);
  const fantasyCards = cards.filter(card => card.type === 'fantasy' && !card.groupId);
  
  // Get all grouped cards
  const groupedCardsByType = {
    hot: [] as RetroCardType[],
    disappointment: [] as RetroCardType[],
    fantasy: [] as RetroCardType[]
  };
  
  // Organize grouped cards by type
  cards.filter(card => card.groupId).forEach(card => {
    if (card.type === 'hot') groupedCardsByType.hot.push(card);
    else if (card.type === 'disappointment') groupedCardsByType.disappointment.push(card);
    else if (card.type === 'fantasy') groupedCardsByType.fantasy.push(card);
  });
  
  // Create map of group data
  const groupDataMap = new Map<string, CardGroup>();
  cardGroups.forEach(group => {
    groupDataMap.set(group.id, group);
  });
  
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
      // Only include groups that have at least one card of this type
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

            {/* Card Creation Form */}
            <Card className="border-pornoretro-orange/30 bg-pornoretro-black/90">
              <CardHeader>
                <CardTitle className="text-xl text-pornoretro-orange">Aggiungi una nuova scheda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant={newCardType === 'hot' ? 'default' : 'outline'} 
                      className={`flex items-center ${newCardType === 'hot' ? 'bg-green-600 hover:bg-green-700' : 'border-green-500 text-green-500 hover:bg-green-900/20'}`}
                      onClick={() => setNewCardType('hot')}
                    >
                      <Flame className="w-4 h-4 mr-2" />
                      Hot Moments
                    </Button>
                    <Button 
                      variant={newCardType === 'disappointment' ? 'default' : 'outline'} 
                      className={`flex items-center ${newCardType === 'disappointment' ? 'bg-red-600 hover:bg-red-700' : 'border-red-500 text-red-500 hover:bg-red-900/20'}`}
                      onClick={() => setNewCardType('disappointment')}
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Disappointments
                    </Button>
                    <Button 
                      variant={newCardType === 'fantasy' ? 'default' : 'outline'} 
                      className={`flex items-center ${newCardType === 'fantasy' ? 'bg-pornoretro-orange hover:bg-pornoretro-darkorange' : 'border-pornoretro-orange text-pornoretro-orange hover:bg-pornoretro-orange/20'}`}
                      onClick={() => setNewCardType('fantasy')}
                    >
                      <HeartHandshake className="w-4 h-4 mr-2" />
                      Team Fantasy
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Cosa vuoi condividere con il team?"
                    value={newCardContent}
                    onChange={(e) => setNewCardContent(e.target.value)}
                    className="min-h-[100px] bg-secondary/20 border-secondary/30"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleAddCard} 
                  disabled={isSubmitting || !newCardContent.trim()} 
                  className="w-full bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Adding...' : 'Aggiungi scheda'}
                </Button>
              </CardFooter>
            </Card>

            {/* Tabs for viewing cards */}
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 gap-2 bg-secondary/20">
                <TabsTrigger value="all" className="data-[state=active]:bg-pornoretro-orange data-[state=active]:text-pornoretro-black">Tutte</TabsTrigger>
                <TabsTrigger value="hot" className="data-[state=active]:bg-green-600">Hot Moments</TabsTrigger>
                <TabsTrigger value="disappointment" className="data-[state=active]:bg-red-600">Disappointments</TabsTrigger>
                <TabsTrigger value="fantasy" className="data-[state=active]:bg-pornoretro-orange">Team Fantasy</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Hot Column */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-green-500 flex items-center">
                      <Flame className="mr-2" /> Hot Moments
                      <span className="ml-2 bg-green-900/50 text-green-300 text-xs px-2 py-1 rounded">
                        {hotCards.length + groupedCardsByType.hot.length}
                      </span>
                    </h2>
                    
                    {/* Hot Groups */}
                    {hotGroups.map(({group, cards}) => (
                      <RetroCardGroup
                        key={group.id}
                        id={group.id}
                        title={group.title}
                        cards={cards}
                        onVote={handleVote}
                        onAddComment={handleAddComment}
                        onCreateAction={handleCreateAction}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                        onRemoveCard={handleRemoveCardFromGroup}
                        onEditTitle={handleEditGroupTitle}
                        votedCards={votedCards}
                        currentUser={username}
                      />
                    ))}
                    
                    {/* Hot Individual Cards */}
                    {hotCards.map(card => (
                      <RetroCard
                        key={card.id}
                        id={card.id}
                        type={card.type}
                        content={card.content}
                        author={card.author}
                        votes={card.votes}
                        comments={card.comments}
                        onVote={handleVote}
                        onAddComment={handleAddComment}
                        onCreateAction={handleCreateAction}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                        onDrop={handleCreateGroup}
                        hasVoted={votedCards.has(card.id)}
                        currentUser={username}
                      />
                    ))}
                  </div>
                  
                  {/* Disappointment Column */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-red-500 flex items-center">
                      <ThumbsDown className="mr-2" /> Disappointments
                      <span className="ml-2 bg-red-900/50 text-red-300 text-xs px-2 py-1 rounded">
                        {disappointmentCards.length + groupedCardsByType.disappointment.length}
                      </span>
                    </h2>
                    
                    {/* Disappointment Groups */}
                    {disappointmentGroups.map(({group, cards}) => (
                      <RetroCardGroup
                        key={group.id}
                        id={group.id}
                        title={group.title}
                        cards={cards}
                        onVote={handleVote}
                        onAddComment={handleAddComment}
                        onCreateAction={handleCreateAction}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                        onRemoveCard={handleRemoveCardFromGroup}
                        onEditTitle={handleEditGroupTitle}
                        votedCards={votedCards}
                        currentUser={username}
                      />
                    ))}
                    
                    {/* Disappointment Individual Cards */}
                    {disappointmentCards.map(card => (
                      <RetroCard
                        key={card.id}
                        id={card.id}
                        type={card.type}
                        content={card.content}
                        author={card.author}
                        votes={card.votes}
                        comments={card.comments}
                        onVote={handleVote}
                        onAddComment={handleAddComment}
                        onCreateAction={handleCreateAction}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                        onDrop={handleCreateGroup}
                        hasVoted={votedCards.has(card.id)}
                        currentUser={username}
                      />
                    ))}
                  </div>
                  
                  {/* Fantasy Column */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-pornoretro-orange flex items-center">
                      <HeartHandshake className="mr-2" /> Team Fantasy
                      <span className="ml-2 bg-pornoretro-darkorange/50 text-pornoretro-orange/90 text-xs px-2 py-1 rounded">
                        {fantasyCards.length + groupedCardsByType.fantasy.length}
                      </span>
                    </h2>
                    
                    {/* Fantasy Groups */}
                    {fantasyGroups.map(({group, cards}) => (
                      <RetroCardGroup
                        key={group.id}
                        id={group.id}
                        title={group.title}
                        cards={cards}
                        onVote={handleVote}
                        onAddComment={handleAddComment}
                        onCreateAction={handleCreateAction}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                        onRemoveCard={handleRemoveCardFromGroup}
                        onEditTitle={handleEditGroupTitle}
                        votedCards={votedCards}
                        currentUser={username}
                      />
                    ))}
                    
                    {/* Fantasy Individual Cards */}
                    {fantasyCards.map(card => (
                      <RetroCard
                        key={card.id}
                        id={card.id}
                        type={card.type}
                        content={card.content}
                        author={card.author}
                        votes={card.votes}
                        comments={card.comments}
                        onVote={handleVote}
                        onAddComment={handleAddComment}
                        onCreateAction={handleCreateAction}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                        onDrop={handleCreateGroup}
                        hasVoted={votedCards.has(card.id)}
                        currentUser={username}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="hot" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {hotGroups.map(({group, cards}) => (
                    <RetroCardGroup
                      key={group.id}
                      id={group.id}
                      title={group.title}
                      cards={cards}
                      onVote={handleVote}
                      onAddComment={handleAddComment}
                      onCreateAction={handleCreateAction}
                      onEditComment={handleEditComment}
                      onDeleteComment={handleDeleteComment}
                      onRemoveCard={handleRemoveCardFromGroup}
                      onEditTitle={handleEditGroupTitle}
                      votedCards={votedCards}
                      currentUser={username}
                    />
                  ))}
                  
                  {hotCards.map(card => (
                    <RetroCard
                      key={card.id}
                      id={card.id}
                      type={card.type}
                      content={card.content}
                      author={card.author}
                      votes={card.votes}
                      comments={card.comments}
                      onVote={handleVote}
                      onAddComment={handleAddComment}
                      onCreateAction={handleCreateAction}
                      onEditComment={handleEditComment}
                      onDeleteComment={handleDeleteComment}
                      onDrop={handleCreateGroup}
                      hasVoted={votedCards.has(card.id)}
                      currentUser={username}
                    />
                  ))}
                  
                  {hotCards.length === 0 && hotGroups.length === 0 && (
                    <div className="col-span-2 text-center p-12 border border-dashed border-muted rounded-lg">
                      <p className="text-muted-foreground">Non ci sono ancora schede Hot Moments</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="disappointment" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {disappointmentGroups.map(({group, cards}) => (
                    <RetroCardGroup
                      key={group.id}
                      id={group.id}
                      title={group.title}
                      cards={cards}
                      onVote={handleVote}
                      onAddComment={handleAddComment}
                      onCreateAction={handleCreateAction}
                      onEditComment={handleEditComment}
                      onDeleteComment={handleDeleteComment}
                      onRemoveCard={handleRemoveCardFromGroup}
                      onEditTitle={handleEditGroupTitle}
                      votedCards={votedCards}
                      currentUser={username}
                    />
                  ))}
                  
                  {disappointmentCards.map(card => (
                    <RetroCard
                      key={card.id}
                      id={card.id}
                      type={card.type}
                      content={card.content}
                      author={card.author}
                      votes={card.votes}
                      comments={card.comments}
                      onVote={handleVote}
                      onAddComment={handleAddComment}
                      onCreateAction={handleCreateAction}
                      onEditComment={handleEditComment}
                      onDeleteComment={handleDeleteComment}
                      onDrop={handleCreateGroup}
                      hasVoted={votedCards.has(card.id)}
                      currentUser={username}
                    />
                  ))}
                  
                  {disappointmentCards.length === 0 && disappointmentGroups.length === 0 && (
                    <div className="col-span-2 text-center p-12 border border-dashed border-muted rounded-lg">
                      <p className="text-muted-foreground">Non ci sono ancora schede Disappointment</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="fantasy" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fantasyGroups.map(({group, cards}) => (
                    <RetroCardGroup
                      key={group.id}
                      id={group.id}
                      title={group.title}
                      cards={cards}
                      onVote={handleVote}
                      onAddComment={handleAddComment}
                      onCreateAction={handleCreateAction}
                      onEditComment={handleEditComment}
                      onDeleteComment={handleDeleteComment}
                      onRemoveCard={handleRemoveCardFromGroup}
                      onEditTitle={handleEditGroupTitle}
                      votedCards={votedCards}
                      currentUser={username}
                    />
                  ))}
                  
                  {fantasyCards.map(card => (
                    <RetroCard
                      key={card.id}
                      id={card.id}
                      type={card.type}
                      content={card.content}
                      author={card.author}
                      votes={card.votes}
                      comments={card.comments}
                      onVote={handleVote}
                      onAddComment={handleAddComment}
                      onCreateAction={handleCreateAction}
                      onEditComment={handleEditComment}
                      onDeleteComment={handleDeleteComment}
                      onDrop={handleCreateGroup}
                      hasVoted={votedCards.has(card.id)}
                      currentUser={username}
                    />
                  ))}
                  
                  {fantasyCards.length === 0 && fantasyGroups.length === 0 && (
                    <div className="col-span-2 text-center p-12 border border-dashed border-muted rounded-lg">
                      <p className="text-muted-foreground">Non ci sono ancora schede Team Fantasy</p>
                    </div>
                  )}
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
