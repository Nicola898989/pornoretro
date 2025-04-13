
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RetroCard, { CardType, Comment } from '@/components/RetroCard';
import AddCardForm from '@/components/AddCardForm';
import ActionItem, { ActionItemType } from '@/components/ActionItem';
import NewActionItemForm from '@/components/NewActionItemForm';
import RetroReport from '@/components/RetroReport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, Users, Link2, FileText, Hash } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import RetroCardGroup from '@/components/RetroCardGroup';

interface RetroCard {
  id: string;
  type: CardType;
  content: string;
  author: string;
  votes: number;
  voterIds: string[];
  comments: Comment[];
  groupId?: string;
}

interface RetroData {
  id: string;
  name: string;
  team: string;
  creator: string;
  createdAt: string;
  isAnonymous: boolean;
}

interface CardGroup {
  id: string;
  title: string;
  cards: RetroCard[];
}

const RetroSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [retroData, setRetroData] = useState<RetroData | null>(null);
  const [cards, setCards] = useState<RetroCard[]>([]);
  const [actions, setActions] = useState<ActionItemType[]>([]);
  const [cardGroups, setCardGroups] = useState<CardGroup[]>([]);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [votedCards, setVotedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [createActionDialogOpen, setCreateActionDialogOpen] = useState(false);
  const [selectedCardForAction, setSelectedCardForAction] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [retroUrl, setRetroUrl] = useState('');

  useEffect(() => {
    if (id) {
      setRetroUrl(`${window.location.origin}/retro/${id}`);
    }
    
    const loadRetro = async () => {
      if (!id) {
        setErrorDetails("No retrospective ID provided");
        setLoading(false);
        return;
      }

      try {
        const { data: retroData, error: retroError } = await supabase
          .from('retrospectives')
          .select('*')
          .eq('id', id)
          .single();
          
        if (retroError) {
          console.error("Supabase query error:", retroError);
          setErrorDetails(`Database error: ${retroError.message}`);
          setLoading(false);
          return;
        }
        
        if (!retroData) {
          console.error(`No retrospective found with ID: ${id}`);
          setErrorDetails(`No retrospective found with ID: ${id}. Please check if the ID is correct.`);
          setLoading(false);
          return;
        }
        
        setRetroData({
          id: retroData.id,
          name: retroData.name,
          team: retroData.team,
          creator: retroData.created_by,
          createdAt: retroData.created_at,
          isAnonymous: retroData.is_anonymous || false
        });
        
        await fetchCards();
        
        await fetchActions();
        
        await fetchCardGroups();

        setupRealtimeSubscription();
        
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
          setJoinDialogOpen(true);
        } else {
          setCurrentUser(storedUser);
          fetchUserVotes(storedUser);
        }
      } catch (error) {
        console.error("Error loading retrospective:", error);
        setErrorDetails(`Failed to load retrospective: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadRetro();

    return () => {
      const channel = supabase.channel('schema-db-changes');
      supabase.removeChannel(channel);
    };
  }, [id]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'retro_cards', filter: `retro_id=eq.${id}` },
          async (payload) => {
            console.log('Realtime card change detected:', payload);
            await fetchCards();
          }
      )
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'retro_actions', filter: `retro_id=eq.${id}` },
          async (payload) => {
            console.log('Realtime action change detected:', payload);
            await fetchActions();
          }
      )
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'retro_card_votes' },
          async (payload) => {
            console.log('Realtime vote change detected:', payload);
            await fetchCards();
            if (currentUser) {
              await fetchUserVotes(currentUser);
            }
          }
      )
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'retro_comments' },
          async (payload) => {
            console.log('Realtime comment change detected:', payload);
            await fetchCards();
          }
      )
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'retro_card_groups' },
          async (payload) => {
            console.log('Realtime card group change detected:', payload);
            await fetchCardGroups();
            await fetchCards();
          }
      )
      .subscribe();
  };

  const fetchCards = async () => {
    if (!id) return;
    
    try {
      const { data: cardsData, error: cardsError } = await supabase
        .from('retro_cards')
        .select('*')
        .eq('retro_id', id);
        
      if (cardsError) {
        throw cardsError;
      }
      
      if (cardsData) {
        const cardsWithVotes = await Promise.all(cardsData.map(async (card) => {
          const { data: votesData } = await supabase
            .from('retro_card_votes')
            .select('user_id')
            .eq('card_id', card.id);
          
          const { data: commentsData } = await supabase
            .from('retro_comments')
            .select('*')
            .eq('card_id', card.id)
            .order('created_at', { ascending: true });
          
          const votes = votesData ? votesData.length : 0;
          const voterIds = votesData ? votesData.map(vote => vote.user_id) : [];
          
          const comments = commentsData ? commentsData.map(comment => ({
            id: comment.id,
            author: comment.author,
            content: comment.content,
            createdAt: comment.created_at
          })) : [];
          
          return {
            id: card.id,
            type: card.type as CardType,
            content: card.content,
            author: card.author,
            votes: votes,
            voterIds: voterIds,
            comments: comments,
            groupId: card.group_id
          };
        }));
        
        setCards(cardsWithVotes);
      }
    } catch (error) {
      console.error("Error fetching cards:", error);
      toast({
        title: "Error",
        description: "Failed to fetch retrospective cards",
        variant: "destructive",
      });
    }
  };

  const fetchCardGroups = async () => {
    if (!id) return;
    
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('retro_card_groups')
        .select('*')
        .eq('retro_id', id);
        
      if (groupsError) {
        throw groupsError;
      }
      
      if (groupsData) {
        const groups = groupsData.map(group => ({
          id: group.id,
          title: group.title,
          cards: []
        }));
        setCardGroups(groups);
      }
    } catch (error) {
      console.error("Error fetching card groups:", error);
    }
  };

  const fetchActions = async () => {
    if (!id) return;
    
    try {
      const { data: actionsData, error: actionsError } = await supabase
        .from('retro_actions')
        .select('*')
        .eq('retro_id', id);
        
      if (actionsError) {
        throw actionsError;
      }
      
      if (actionsData) {
        setActions(actionsData.map(action => ({
          id: action.id,
          text: action.text,
          assignee: action.assignee || '',
          completed: action.completed,
          linkedCardId: action.linked_card_id,
          linkedCardContent: action.linked_card_content,
          linkedCardType: action.linked_card_type as CardType | undefined
        })));
      }
    } catch (error) {
      console.error("Error fetching actions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch action items",
        variant: "destructive",
      });
    }
  };

  const fetchUserVotes = async (userId: string) => {
    if (!id) return;
    
    try {
      const { data: votesData, error: votesError } = await supabase
        .from('retro_card_votes')
        .select('card_id')
        .eq('user_id', userId);
        
      if (votesError) {
        throw votesError;
      }
      
      if (votesData) {
        const userVotes = new Set<string>();
        votesData.forEach(vote => {
          userVotes.add(vote.card_id);
        });
        setVotedCards(userVotes);
      }
    } catch (error) {
      console.error("Error fetching user votes:", error);
    }
  };

  const handleJoinRetro = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserName.trim()) {
      toast({
        title: "Please enter your name",
        description: "We need to know who you are",
        variant: "destructive",
      });
      return;
    }
    
    localStorage.setItem('currentUser', newUserName.trim());
    setCurrentUser(newUserName.trim());
    setJoinDialogOpen(false);
    
    toast({
      title: "Welcome to the retrospective!",
      description: `You've joined as ${newUserName.trim()}`,
    });
    
    await fetchUserVotes(newUserName.trim());
  };

  const handleAddCard = async (content: string, type: CardType) => {
    if (!retroData || !currentUser) return;
    
    try {
      const newCardId = uuidv4();
      
      const { data, error } = await supabase
        .from('retro_cards')
        .insert([{
          id: newCardId,
          retro_id: retroData.id,
          type: type,
          content: content,
          author: retroData.isAnonymous ? "Anonymous" : currentUser,
        }])
        .select();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Card added",
        description: "Your thought has been added to the retrospective",
      });
      
      await fetchCards();
    } catch (error) {
      console.error("Error adding card:", error);
      toast({
        title: "Error",
        description: "Failed to add card. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVoteCard = async (cardId: string) => {
    if (!retroData || !currentUser) return;
    
    const hasVoted = votedCards.has(cardId);
    
    try {
      if (hasVoted) {
        const { error } = await supabase
          .from('retro_card_votes')
          .delete()
          .eq('card_id', cardId)
          .eq('user_id', currentUser);
        
        if (error) throw error;
        
        const updatedVotes = new Set(votedCards);
        updatedVotes.delete(cardId);
        setVotedCards(updatedVotes);
        
        toast({
          title: "Vote removed",
          description: "Your vote has been removed from this card",
        });
      } else {
        const { error } = await supabase
          .from('retro_card_votes')
          .insert([{
            card_id: cardId,
            user_id: currentUser
          }]);
        
        if (error) throw error;
        
        const updatedVotes = new Set(votedCards);
        updatedVotes.add(cardId);
        setVotedCards(updatedVotes);
        
        toast({
          title: "Vote added",
          description: "Your vote has been added to this card",
        });
      }
    } catch (error) {
      console.error("Error updating vote:", error);
      toast({
        title: "Error",
        description: "Failed to update vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (cardId: string, content: string) => {
    if (!retroData || !currentUser) return;
    
    try {
      const newCommentId = uuidv4();
      
      const { error } = await supabase
        .from('retro_comments')
        .insert([{
          id: newCommentId,
          card_id: cardId,
          author: retroData.isAnonymous ? "Anonymous" : currentUser,
          content: content
        }]);
      
      if (error) throw error;
      
      toast({
        title: "Comment added",
        description: "Your comment has been added to the card",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditComment = async (cardId: string, commentId: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from('retro_comments')
        .update({ content: newContent })
        .eq('id', commentId);
      
      if (error) throw error;
      
      toast({
        title: "Comment updated",
        description: "Your comment has been updated",
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
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
        title: "Comment deleted",
        description: "Your comment has been removed",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddActionItem = async (text: string, assignee: string, cardId?: string) => {
    if (!retroData) return;
    
    let linkedCardContent: string | undefined = undefined;
    let linkedCardType: CardType | undefined = undefined;
    
    if (cardId) {
      const linkedCard = cards.find(card => card.id === cardId);
      if (linkedCard) {
        linkedCardContent = linkedCard.content;
        linkedCardType = linkedCard.type;
      }
    }
    
    try {
      const newActionId = uuidv4();
      
      const { error } = await supabase
        .from('retro_actions')
        .insert([{
          id: newActionId,
          retro_id: retroData.id,
          text: text,
          assignee: assignee || null,
          completed: false,
          linked_card_id: cardId || null,
          linked_card_content: linkedCardContent || null,
          linked_card_type: linkedCardType || null
        }]);
      
      if (error) throw error;
      
      toast({
        title: "Action item added",
        description: "New action item has been added to the list",
      });
      
      if (createActionDialogOpen) {
        setCreateActionDialogOpen(false);
        setSelectedCardForAction(null);
      }
    } catch (error) {
      console.error("Error adding action item:", error);
      toast({
        title: "Error",
        description: "Failed to add action item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActionComplete = async (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;
    
    try {
      const { error } = await supabase
        .from('retro_actions')
        .update({ completed: !action.completed })
        .eq('id', actionId);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error updating action item:", error);
      toast({
        title: "Error",
        description: "Failed to update action item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    try {
      const { error } = await supabase
        .from('retro_actions')
        .delete()
        .eq('id', actionId);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting action item:", error);
      toast({
        title: "Error",
        description: "Failed to delete action item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateActionFromCard = (cardId: string) => {
    setSelectedCardForAction(cardId);
    setCreateActionDialogOpen(true);
  };

  const handleCreateGroup = async (cardId: string, targetCardId: string) => {
    if (!retroData) return;
    
    const card = cards.find(c => c.id === cardId);
    const targetCard = cards.find(c => c.id === targetCardId);
    
    if (!card || !targetCard) return;
    
    try {
      // Se la carta target è già in un gruppo, aggiungi la carta a quel gruppo
      if (targetCard.groupId) {
        const { error } = await supabase
          .from('retro_cards')
          .update({ group_id: targetCard.groupId })
          .eq('id', cardId);
          
        if (error) throw error;
        
        toast({
          title: "Cards grouped",
          description: "The card has been added to the existing group",
        });
      } 
      // Se entrambe le carte non sono in un gruppo, crea un nuovo gruppo
      else {
        // Crea un nuovo gruppo
        const newGroupId = uuidv4();
        const groupTitle = `${card.type} Group`;
        
        const { error: groupError } = await supabase
          .from('retro_card_groups')
          .insert([{
            id: newGroupId,
            retro_id: retroData.id,
            title: groupTitle,
            created_at: new Date().toISOString()
          }]);
          
        if (groupError) throw groupError;
        
        // Aggiungi entrambe le carte al nuovo gruppo
        const { error: cardsError } = await supabase
          .from('retro_cards')
          .update({ group_id: newGroupId })
          .in('id', [cardId, targetCardId]);
          
        if (cardsError) throw cardsError;
        
        toast({
          title: "New group created",
          description: "Cards have been grouped together",
        });
      }
      
      await fetchCards();
      await fetchCardGroups();
    } catch (error) {
      console.error("Error grouping cards:", error);
      toast({
        title: "Error",
        description: "Failed to group cards. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromGroup = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('retro_cards')
        .update({ group_id: null })
        .eq('id', cardId);
        
      if (error) throw error;
      
      toast({
        title: "Card removed from group",
        description: "The card has been removed from its group",
      });
      
      await fetchCards();
    } catch (error) {
      console.error("Error removing card from group:", error);
      toast({
        title: "Error",
        description: "Failed to remove card from group. Please try again.",
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
        title: "Group updated",
        description: "The group title has been updated",
      });
      
      await fetchCardGroups();
    } catch (error) {
      console.error("Error updating group title:", error);
      toast({
        title: "Error",
        description: "Failed to update group title. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyRetroLink = () => {
    navigator.clipboard.writeText(retroUrl);
    toast({
      title: "Link copied!",
      description: "Share this link with your team members",
    });
    setShareDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-pornoretro-black">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-2xl">Loading retrospective...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (errorDetails) {
    return (
      <div className="flex flex-col min-h-screen bg-pornoretro-black">
        <Header />
        <main className="flex-grow container mx-auto py-8 px-4">
          <div className="max-w-lg mx-auto space-y-6">
            <Alert variant="destructive" className="bg-red-900/20 border-red-500/50">
              <AlertTitle className="text-2xl mb-2 text-red-400">Retrospective not found</AlertTitle>
              <AlertDescription className="text-lg">
                The session you're looking for doesn't exist
              </AlertDescription>
            </Alert>
            
            <div className="bg-pornoretro-black/30 p-4 rounded-md border border-gray-700">
              <h3 className="font-semibold mb-2 text-pornoretro-orange">Debug Information</h3>
              <p className="text-sm mb-4">{errorDetails}</p>
              
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-400">Requested ID</h4>
                <code className="bg-gray-800 px-2 py-1 rounded text-gray-300 block">{id}</code>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => navigate('/join')}
                variant="outline"
                className="border-pornoretro-orange text-pornoretro-orange"
              >
                Join Another Retrospective
              </Button>
              <Button 
                onClick={() => navigate('/new-retro')}
                className="bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange"
              >
                Create New Retrospective
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!retroData) {
    return (
      <div className="flex flex-col min-h-screen bg-pornoretro-black">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-2xl">Retrospective not found</div>
        </main>
        <Footer />
      </div>
    );
  }

  // Prepare card data
  const groupedCards = cards.filter(card => card.groupId);
  const ungroupedCards = cards.filter(card => !card.groupId);
  
  const hotCards = ungroupedCards.filter(card => card.type === 'hot');
  const disappointmentCards = ungroupedCards.filter(card => card.type === 'disappointment');
  const fantasyCards = ungroupedCards.filter(card => card.type === 'fantasy');

  const sortByVotes = (a: RetroCard, b: RetroCard) => b.votes - a.votes;
  hotCards.sort(sortByVotes);
  disappointmentCards.sort(sortByVotes);
  fantasyCards.sort(sortByVotes);

  // Prepare groups with their cards
  const populatedGroups = cardGroups.map(group => ({
    ...group,
    cards: groupedCards.filter(card => card.groupId === group.id)
  }));

  const cardOptions = cards.map(card => ({
    id: card.id,
    content: card.content,
    type: card.type
  }));

  return (
    <div className="flex flex-col min-h-screen bg-pornoretro-black">
      <Header />
      
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-pornoretro-orange mb-1">{retroData.name}</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-muted-foreground">
                <Users className="w-4 h-4 mr-1" />
                <span>{retroData.team}</span>
              </div>
              <div className="flex items-center">
                <Hash className="w-4 h-4 mr-1 text-muted-foreground" />
                <Badge variant="outline" className="bg-secondary/50 border-pornoretro-orange/20">
                  ID: {retroData.id}
                </Badge>
              </div>
              <div className="text-muted-foreground text-sm">
                {retroData.isAnonymous ? 
                  "Feedback is anonymous" : 
                  "Feedback includes names"}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <RetroReport 
              retroName={retroData.name}
              teamName={retroData.team}
              createdAt={retroData.createdAt}
              cards={cards}
              actions={actions}
            />
            <Button 
              variant="outline" 
              className="border-pornoretro-orange text-pornoretro-orange hover:bg-pornoretro-orange hover:text-pornoretro-black transition-colors"
              onClick={() => setShareDialogOpen(true)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Share</span>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="all-cards" className="mb-6">
              <TabsList className="bg-secondary">
                <TabsTrigger value="all-cards">All Categories</TabsTrigger>
                <TabsTrigger value="hot">Hot Moments</TabsTrigger>
                <TabsTrigger value="disappointments">Disappointments</TabsTrigger>
                <TabsTrigger value="fantasies">Team Fantasies</TabsTrigger>
                <TabsTrigger value="groups">Card Groups</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all-cards" className="mt-6">
                {populatedGroups.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-pornoretro-orange mb-4">Grouped Cards</h2>
                    <div className="space-y-6">
                      {populatedGroups.map(group => (
                        <RetroCardGroup 
                          key={group.id}
                          id={group.id}
                          title={group.title}
                          cards={group.cards}
                          onVote={handleVoteCard}
                          onAddComment={handleAddComment}
                          onCreateAction={handleCreateActionFromCard}
                          onEditComment={handleEditComment}
                          onDeleteComment={handleDeleteComment}
                          onRemoveCard={handleRemoveFromGroup}
                          onEditTitle={handleEditGroupTitle}
                          votedCards={votedCards}
                          currentUser={currentUser}
                        />
                      ))}
                    </div>
                  </div>
                )}
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <h2 className="text-xl font-bold text-green-400 md:col-span-2">Hot moments 🔥</h2>
                  {hotCards.length === 0 ? (
                    <p className="text-muted-foreground md:col-span-2">No hot moments added yet</p>
                  ) : (
                    hotCards.map(card => (
                      <RetroCard 
                        key={card.id}
                        id={card.id}
                        type={card.type}
                        content={card.content}
                        author={card.author}
                        votes={card.votes}
                        comments={card.comments}
                        onVote={handleVoteCard}
                        onAddComment={handleAddComment}
                        onCreateAction={handleCreateActionFromCard}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                        onDrop={handleCreateGroup}
                        hasVoted={votedCards.has(card.id)}
                        currentUser={currentUser}
                      />
                    ))
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <h2 className="text-xl font-bold text-red-400 md:col-span-2">Disappointments 😢</h2>
                  {disappointmentCards.length === 0 ? (
                    <p className="text-muted-foreground md:col-span-2">No disappointments added yet</p>
                  ) : (
                    disappointmentCards.map(card => (
                      <RetroCard 
                        key={card.id}
                        id={card.id}
                        type={card.type}
                        content={card.content}
                        author={card.author}
                        votes={card.votes}
                        comments={card.comments}
                        onVote={handleVoteCard}
                        onAddComment={handleAddComment}
                        onCreateAction={handleCreateActionFromCard}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                        onDrop={handleCreateGroup}
                        hasVoted={votedCards.has(card.id)}
                        currentUser={currentUser}
                      />
                    ))
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <h2 className="text-xl font-bold text-pornoretro-orange md:col-span-2">Team Fantasies ✨</h2>
                  {fantasyCards.length === 0 ? (
                    <p className="text-muted-foreground md:col-span-2">No team fantasies added yet</p>
                  ) : (
                    fantasyCards.map(card => (
                      <RetroCard 
                        key={card.id}
                        id={card.id}
                        type={card.type}
                        content={card.content}
                        author={card.author}
                        votes={card.votes}
                        comments={card.comments}
                        onVote={handleVoteCard}
                        onAddComment={handleAddComment}
                        onCreateAction={handleCreateActionFromCard}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                        onDrop={handleCreateGroup}
                        hasVoted={votedCards.has(card.id)}
                        currentUser={currentUser}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="hot" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <h2 className="text-xl font-bold text-green-400 md:col-span-2">Hot moments 🔥</h2>
                  {hotCards.length === 0 ? (
                    <p className="text-muted-foreground md:col-span-2">No hot moments added yet</p>
                  ) : (
                    hotCards.map(card => (
                      <RetroCard 
                        key={card.id}
                        id={card.id}
                        type={card.type}
                        content={card.content}
                        author={card.author}
                        votes={card.votes}
                        comments={card.comments}
                        onVote={handleVoteCard}
                        onAddComment={handleAddComment}
                        onCreateAction={handleCreateActionFromCard}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                        onDrop={handleCreateGroup}
                        hasVoted={votedCards.has(card.id)}
                        currentUser={currentUser}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="disappointments" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <h2 className="text-xl font-bold text-red-400 md:col-span-2">Disappointments 😢</h2>
                  {disappointmentCards.length === 0 ? (
                    <p className="text-muted-foreground md:col-span-2">No disappointments added yet</p>
                  ) : (
                    disappointmentCards.map(card => (
                      <RetroCard 
                        key={card.id}
                        id={card.id}
                        type={card.type}
                        content={card.content}
                        author={card.author}
                        votes={card.votes}
                        comments={card.comments}
                        onVote={handleVoteCard}
                        onAddComment={handleAddComment}
                        onCreateAction={handleCreateActionFromCard}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                        onDrop={handleCreateGroup}
                        hasVoted={votedCards.has(card.id)}
                        currentUser={currentUser}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="fantasies" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <h2 className="text-xl font-bold text-pornoretro-orange md:col-span-2">Team Fantasies ✨</h2>
                  {fantasyCards.length === 0 ? (
                    <p className="text-muted-foreground md:col-span-2">No team fantasies added yet</p>
                  ) : (
                    fantasyCards.map(card => (
                      <RetroCard 
                        key={card.id}
                        id={card.id}
                        type={card.type}
                        content={card.content}
                        author={card.author}
                        votes={card.votes}
                        comments={card.comments}
                        onVote={handleVoteCard}
                        onAddComment={handleAddComment}
                        onCreateAction={handleCreateActionFromCard}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                        onDrop={handleCreateGroup}
                        hasVoted={votedCards.has(card.id)}
                        currentUser={currentUser}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="groups" className="mt-6">
                {populatedGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <h2 className="text-xl font-bold text-pornoretro-orange mb-2">No Card Groups Yet</h2>
                    <p className="text-muted-foreground">
                      Drag and drop cards onto each other to create groups and organize your thoughts.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {populatedGroups.map(group => (
                      <RetroCardGroup 
                        key={group.id}
                        id={group.id}
                        title={group.title}
                        cards={group.cards}
                        onVote={handleVoteCard}
                        onAddComment={handleAddComment}
                        onCreateAction={handleCreateActionFromCard}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                        onRemoveCard={handleRemoveFromGroup}
                        onEditTitle={handleEditGroupTitle}
                        votedCards={votedCards}
                        currentUser={currentUser}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <AddCardForm onAddCard={handleAddCard} />
            
            <div>
              <h2 className="text-xl font-bold text-pornoretro-orange mb-4">Action Items</h2>
              <div className="space-y-4">
                <div className="space-y-3">
                  {actions.length === 0 ? (
                    <p className="text-muted-foreground">No action items yet</p>
                  ) : (
                    actions.map(action => (
                      <ActionItem 
                        key={action.id} 
                        item={action} 
                        onToggleComplete={handleToggleActionComplete}
                        onDelete={handleDeleteAction}
                      />
                    ))
                  )}
                </div>
                
                <NewActionItemForm 
                  onAdd={handleAddActionItem} 
                  cards={cardOptions}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pornoretro-orange">Join the Retrospective</DialogTitle>
            <DialogDescription>
              Please enter your name to join this hot retrospective session.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJoinRetro} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input 
                id="name" 
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="e.g. John Developer"
                className="bg-secondary"
              />
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                className="bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange"
              >
                Join Session
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pornoretro-orange">Share Retrospective</DialogTitle>
            <DialogDescription>
              Share this link with your team members to invite them to this retro session.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">Link</Label>
              <Input
                id="link"
                readOnly
                value={retroUrl}
                className="bg-secondary"
              />
            </div>
            <Button 
              size="sm"
              className="px-3 bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange"
              onClick={copyRetroLink}
            >
              <span className="sr-only">Copy</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-muted-foreground">Anyone with the link can join this retro session</p>
          </div>
          <div className="mt-2 p-2 bg-secondary/30 rounded flex items-center">
            <Hash className="h-4 w-4 text-muted-foreground mr-2" />
            <p className="text-muted-foreground">Retrospective ID: {retroData.id}</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createActionDialogOpen} onOpenChange={setCreateActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pornoretro-orange">Create Action Item</DialogTitle>
            <DialogDescription>
              Create a new action item linked to this card.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCardForAction && (
            <NewActionItemForm 
              onAdd={handleAddActionItem}
              selectedCardId={selectedCardForAction}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RetroSession;
