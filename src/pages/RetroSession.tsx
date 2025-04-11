
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RetroCard, { CardType } from '@/components/RetroCard';
import AddCardForm from '@/components/AddCardForm';
import ActionItem, { ActionItemType } from '@/components/ActionItem';
import NewActionItemForm from '@/components/NewActionItemForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, Users } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface RetroCard {
  id: string;
  type: CardType;
  content: string;
  author: string;
  votes: number;
  voterIds: string[];
}

interface RetroData {
  id: string;
  name: string;
  team: string;
  creator: string;
  createdAt: string;
  cards: RetroCard[];
  actions: ActionItemType[];
}

const RetroSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [retroData, setRetroData] = useState<RetroData | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [votedCards, setVotedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) {
      toast({
        title: "Not logged in",
        description: "Please join with your name first",
        variant: "destructive",
      });
      navigate('/join');
      return;
    }
    setCurrentUser(storedUser);
    
    // Get retro data
    if (id) {
      const retroKey = `retro_${id}`;
      const storedRetro = localStorage.getItem(retroKey);
      
      if (!storedRetro) {
        toast({
          title: "Retrospective not found",
          description: "The session you're looking for doesn't exist",
          variant: "destructive",
        });
        navigate('/join');
        return;
      }
      
      try {
        const data = JSON.parse(storedRetro) as RetroData;
        setRetroData(data);
        
        // Get voted cards for this user
        const userVotes = new Set<string>();
        data.cards.forEach(card => {
          if (card.voterIds && card.voterIds.includes(storedUser)) {
            userVotes.add(card.id);
          }
        });
        setVotedCards(userVotes);
      } catch (e) {
        console.error("Error parsing retro data", e);
        toast({
          title: "Error loading retrospective",
          description: "There was a problem loading the data",
          variant: "destructive",
        });
        navigate('/');
      }
    }
    
    setLoading(false);
  }, [id, navigate, toast]);

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
      author: "Anonymous",
      votes: 0,
      voterIds: []
    };
    
    const updatedData = {
      ...retroData,
      cards: [...retroData.cards, newCard]
    };
    
    saveRetroData(updatedData);
  };

  const handleVoteCard = (cardId: string) => {
    if (!retroData) return;
    
    const updatedCards = retroData.cards.map(card => {
      if (card.id === cardId) {
        // If user already voted, do nothing
        if (card.voterIds && card.voterIds.includes(currentUser)) {
          return card;
        }
        
        return {
          ...card,
          votes: card.votes + 1,
          voterIds: [...(card.voterIds || []), currentUser]
        };
      }
      return card;
    });
    
    const updatedVotes = new Set(votedCards);
    updatedVotes.add(cardId);
    setVotedCards(updatedVotes);
    
    const updatedData = {
      ...retroData,
      cards: updatedCards
    };
    
    saveRetroData(updatedData);
  };

  const handleAddActionItem = (text: string, assignee: string) => {
    if (!retroData) return;
    
    const newAction: ActionItemType = {
      id: uuidv4(),
      text,
      assignee,
      completed: false
    };
    
    const updatedData = {
      ...retroData,
      actions: [...retroData.actions, newAction]
    };
    
    saveRetroData(updatedData);
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

  const copyRetroLink = () => {
    const url = `${window.location.origin}/retro/${id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Share this link with your team members",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-pornoretro-black">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-2xl">Loading...</div>
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

  // Separate cards by type
  const hotCards = retroData.cards.filter(card => card.type === 'hot');
  const disappointmentCards = retroData.cards.filter(card => card.type === 'disappointment');
  const fantasyCards = retroData.cards.filter(card => card.type === 'fantasy');

  // Sort cards by votes (descending)
  const sortByVotes = (a: RetroCard, b: RetroCard) => b.votes - a.votes;
  hotCards.sort(sortByVotes);
  disappointmentCards.sort(sortByVotes);
  fantasyCards.sort(sortByVotes);

  return (
    <div className="flex flex-col min-h-screen bg-pornoretro-black">
      <Header />
      
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-pornoretro-orange mb-1">{retroData.name}</h1>
            <div className="flex items-center text-muted-foreground">
              <Users className="w-4 h-4 mr-1" />
              <span>{retroData.team}</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="border-pornoretro-orange text-pornoretro-orange hover:bg-pornoretro-orange hover:text-pornoretro-black transition-colors"
            onClick={copyRetroLink}
          >
            <Share2 className="w-4 h-4 mr-2" />
            <span className="hidden md:inline">Share</span>
            <span className="ml-2 hidden md:inline"><Copy className="w-3.5 h-3.5" /></span>
          </Button>
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
                  <h2 className="text-xl font-bold text-green-400 md:col-span-2">Hot Moments 🔥</h2>
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
                        onVote={handleVoteCard}
                        hasVoted={votedCards.has(card.id)}
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
                        onVote={handleVoteCard}
                        hasVoted={votedCards.has(card.id)}
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
                        onVote={handleVoteCard}
                        hasVoted={votedCards.has(card.id)}
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
                        onVote={handleVoteCard}
                        hasVoted={votedCards.has(card.id)}
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
                        onVote={handleVoteCard}
                        hasVoted={votedCards.has(card.id)}
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
                        onVote={handleVoteCard}
                        hasVoted={votedCards.has(card.id)}
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
                
                <NewActionItemForm onAdd={handleAddActionItem} />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default RetroSession;
