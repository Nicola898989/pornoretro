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

interface RetroCard {
  id: string;
  type: CardType;
  content: string;
  author: string;
  votes: number;
  voterIds: string[];
  comments: Comment[];
}

interface RetroData {
  id: string;
  name: string;
  team: string;
  creator: string;
  createdAt: string;
  cards: RetroCard[];
  actions: ActionItemType[];
  isAnonymous: boolean;
}

const RetroSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [retroData, setRetroData] = useState<RetroData | null>(null);
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

      const retroKey = `retro_${id}`;
      const storedRetro = localStorage.getItem(retroKey);
      
      console.log(`Checking localStorage for retro with key: ${retroKey}`);
      console.log(`LocalStorage data found: ${storedRetro ? 'Yes' : 'No'}`);
      
      if (!storedRetro) {
        console.log(`Attempting to fetch retro with ID ${id} from Supabase`);
        try {
          const { data: retroData, error } = await supabase
            .from('retrospectives')
            .select('*')
            .eq('id', id)
            .maybeSingle();
          
          console.log("Supabase fetch result:", { retroData, error });
          
          if (error) {
            console.error("Supabase query error:", error);
            setErrorDetails(`Database error: ${error.message}`);
            setLoading(false);
            return;
          }
          
          if (!retroData) {
            console.error(`No retrospective found with ID: ${id}`);
            setErrorDetails(`No retrospective found with ID: ${id}. Please check if the ID is correct.`);
            setLoading(false);
            return;
          }
          
          const newLocalRetro: RetroData = {
            id: retroData.id,
            name: retroData.name,
            team: retroData.team,
            creator: retroData.created_by,
            createdAt: retroData.created_at,
            cards: [],
            actions: [],
            isAnonymous: false
          };
          
          const { data: cardsData, error: cardsError } = await supabase
            .from('retro_cards')
            .select('*')
            .eq('retro_id', id);
            
          console.log("Supabase cards data:", { cardsData, cardsError });
          
          if (!cardsError && cardsData) {
            newLocalRetro.cards = cardsData.map(card => ({
              id: card.id,
              type: card.type as CardType,
              content: card.content,
              author: card.author,
              votes: 0,
              voterIds: [],
              comments: []
            }));
          }
          
          localStorage.setItem(retroKey, JSON.stringify(newLocalRetro));
          setRetroData(newLocalRetro);
          
          toast({
            title: "Retrospective loaded from database",
            description: "Successfully retrieved retrospective from Supabase",
          });
        } catch (error) {
          console.error("Error fetching from Supabase:", error);
          setErrorDetails(`Failed to find retrospective with ID: ${id}. Error details: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setLoading(false);
          return;
        }
      } else {
        try {
          const data = JSON.parse(storedRetro) as RetroData;
          
          if (!data.cards.some(card => 'comments' in card)) {
            data.cards = data.cards.map(card => ({
              ...card,
              comments: []
            }));
            localStorage.setItem(retroKey, JSON.stringify(data));
          }
          
          setRetroData(data);
        } catch (e) {
          console.error("Error parsing retro data", e);
          setErrorDetails(`Error parsing retrospective data. Please try again or create a new retrospective.`);
          setLoading(false);
          return;
        }
      }
      
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        setJoinDialogOpen(true);
      } else {
        setCurrentUser(storedUser);
        
        if (retroData) {
          const userVotes = new Set<string>();
          retroData.cards.forEach(card => {
            if (card.voterIds && card.voterIds.includes(storedUser)) {
              userVotes.add(card.id);
            }
          });
          setVotedCards(userVotes);
        }
      }
      
      setLoading(false);
    };
    
    loadRetro();
  }, [id, toast, retroData]);

  const handleJoinRetro = (e: React.FormEvent) => {
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
  };

  const saveRetroData = (data: RetroData) => {
    localStorage.setItem(`retro_${id}`, JSON.stringify(data));
    setRetroData(data);
  };

  const handleAddCard = (content: string, type: CardType) => {
    if (!retroData) return;
    
    const newCard: RetroCard = {
      id: uuidv4(),
      type,
      content,
      author: retroData.isAnonymous ? "Anonymous" : currentUser,
      votes: 0,
      voterIds: [],
      comments: []
    };
    
    const updatedData = {
      ...retroData,
      cards: [...retroData.cards, newCard]
    };
    
    saveRetroData(updatedData);
  };

  const handleVoteCard = (cardId: string) => {
    if (!retroData) return;
    
    const cardIndex = retroData.cards.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;
    
    const card = retroData.cards[cardIndex];
    const userVoted = card.voterIds && card.voterIds.includes(currentUser);
    
    const updatedCards = [...retroData.cards];
    if (userVoted) {
      updatedCards[cardIndex] = {
        ...card,
        votes: Math.max(0, card.votes - 1),
        voterIds: card.voterIds.filter(id => id !== currentUser)
      };
      
      const updatedVotes = new Set(votedCards);
      updatedVotes.delete(cardId);
      setVotedCards(updatedVotes);
      
      toast({
        title: "Vote removed",
        description: "Your vote has been removed from this card",
      });
    } else {
      updatedCards[cardIndex] = {
        ...card,
        votes: card.votes + 1,
        voterIds: [...(card.voterIds || []), currentUser]
      };
      
      const updatedVotes = new Set(votedCards);
      updatedVotes.add(cardId);
      setVotedCards(updatedVotes);
    }
    
    const updatedData = {
      ...retroData,
      cards: updatedCards
    };
    
    saveRetroData(updatedData);
  };

  const handleAddComment = (cardId: string, content: string) => {
    if (!retroData) return;
    
    const newComment: Comment = {
      id: uuidv4(),
      author: retroData.isAnonymous ? "Anonymous" : currentUser,
      content,
      createdAt: new Date().toISOString()
    };
    
    const updatedCards = retroData.cards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          comments: [...(card.comments || []), newComment]
        };
      }
      return card;
    });
    
    const updatedData = {
      ...retroData,
      cards: updatedCards
    };
    
    saveRetroData(updatedData);
    
    toast({
      title: "Comment added",
      description: "Your comment has been added to the card",
    });
  };

  const handleEditComment = (cardId: string, commentId: string, newContent: string) => {
    if (!retroData) return;
    
    const updatedCards = retroData.cards.map(card => {
      if (card.id === cardId) {
        const updatedComments = card.comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              content: newContent,
            };
          }
          return comment;
        });
        
        return {
          ...card,
          comments: updatedComments
        };
      }
      return card;
    });
    
    const updatedData = {
      ...retroData,
      cards: updatedCards
    };
    
    saveRetroData(updatedData);
    
    toast({
      title: "Comment updated",
      description: "Your comment has been updated",
    });
  };

  const handleDeleteComment = (cardId: string, commentId: string) => {
    if (!retroData) return;
    
    const updatedCards = retroData.cards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          comments: card.comments.filter(comment => comment.id !== commentId)
        };
      }
      return card;
    });
    
    const updatedData = {
      ...retroData,
      cards: updatedCards
    };
    
    saveRetroData(updatedData);
    
    toast({
      title: "Comment deleted",
      description: "Your comment has been removed",
    });
  };

  const handleAddActionItem = (text: string, assignee: string, cardId?: string) => {
    if (!retroData) return;
    
    let linkedCardContent: string | undefined = undefined;
    let linkedCardType: CardType | undefined = undefined;
    
    if (cardId) {
      const linkedCard = retroData.cards.find(card => card.id === cardId);
      if (linkedCard) {
        linkedCardContent = linkedCard.content;
        linkedCardType = linkedCard.type;
      }
    }
    
    const newAction: ActionItemType = {
      id: uuidv4(),
      text,
      assignee,
      completed: false,
      linkedCardId: cardId,
      linkedCardContent,
      linkedCardType
    };
    
    const updatedData = {
      ...retroData,
      actions: [...retroData.actions, newAction]
    };
    
    saveRetroData(updatedData);
    
    if (createActionDialogOpen) {
      setCreateActionDialogOpen(false);
      setSelectedCardForAction(null);
    }
  };

  const handleToggleActionComplete = (actionId: string) => {
    if (!retroData) return;
    
    const updatedActions = retroData.actions.map(action => {
      if (action.id === actionId) {
        return {
          ...action,
          completed: !action.completed
        };
      }
      return action;
    });
    
    const updatedData = {
      ...retroData,
      actions: updatedActions
    };
    
    saveRetroData(updatedData);
  };

  const handleDeleteAction = (actionId: string) => {
    if (!retroData) return;
    
    const updatedActions = retroData.actions.filter(
      action => action.id !== actionId
    );
    
    const updatedData = {
      ...retroData,
      actions: updatedActions
    };
    
    saveRetroData(updatedData);
  };

  const handleCreateActionFromCard = (cardId: string) => {
    setSelectedCardForAction(cardId);
    setCreateActionDialogOpen(true);
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

  const hotCards = retroData.cards.filter(card => card.type === 'hot');
  const disappointmentCards = retroData.cards.filter(card => card.type === 'disappointment');
  const fantasyCards = retroData.cards.filter(card => card.type === 'fantasy');

  const sortByVotes = (a: RetroCard, b: RetroCard) => b.votes - a.votes;
  hotCards.sort(sortByVotes);
  disappointmentCards.sort(sortByVotes);
  fantasyCards.sort(sortByVotes);

  const cardOptions = retroData.cards.map(card => ({
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
              cards={retroData.cards}
              actions={retroData.actions}
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
              </TabsList>
              
              <TabsContent value="all-cards" className="mt-6">
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
                        hasVoted={votedCards.has(card.id)}
                        currentUser={currentUser}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <AddCardForm onAddCard={handleAddCard} />
            
            <div>
              <h2 className="text-xl font-bold text-pornoretro-orange mb-4">Action Items</h2>
              <div className="space-y-4">
                <div className="space-y-3">
                  {retroData.actions.length === 0 ? (
                    <p className="text-muted-foreground">No action items yet</p>
                  ) : (
                    retroData.actions.map(action => (
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
