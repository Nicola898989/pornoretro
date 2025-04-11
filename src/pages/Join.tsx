
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface RetroInfo {
  id: string;
  name: string;
  team: string;
  createdAt: string;
}

const Join: React.FC = () => {
  const [retroId, setRetroId] = useState('');
  const [yourName, setYourName] = useState('');
  const [recentRetros, setRecentRetros] = useState<RetroInfo[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get recent retrospectives from localStorage
    const getRecentRetros = () => {
      const retros: RetroInfo[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('retro_')) {
          try {
            const retroData = JSON.parse(localStorage.getItem(key) || '');
            retros.push({
              id: retroData.id,
              name: retroData.name,
              team: retroData.team,
              createdAt: retroData.createdAt
            });
          } catch (e) {
            console.error("Error parsing retro data", e);
          }
        }
      }
      
      // Sort by creation date, newest first
      return retros.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    };
    
    setRecentRetros(getRecentRetros());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!retroId.trim() || !yourName.trim()) {
      toast({
        title: "Incomplete form",
        description: "Please fill in all the required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Check if the retrospective exists
    const retroKey = `retro_${retroId.trim()}`;
    const retroData = localStorage.getItem(retroKey);
    
    if (!retroData) {
      toast({
        title: "Retrospective not found",
        description: "Please check the ID and try again",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, we'd register the participant
    // For now, we'll just navigate to the retro page
    localStorage.setItem("currentUser", yourName.trim());
    
    toast({
      title: "Joined successfully!",
      description: "Welcome to the retrospective",
    });
    
    navigate(`/retro/${retroId.trim()}`);
  };

  const handleJoinRecent = (id: string) => {
    if (!yourName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name first",
        variant: "destructive",
      });
      return;
    }
    
    localStorage.setItem("currentUser", yourName.trim());
    navigate(`/retro/${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="flex flex-col min-h-screen bg-pornoretro-black">
      <Header />
      
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto">
          <Card className="border-pornoretro-orange/30 mb-8">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-2xl text-pornoretro-orange">Join Retrospective</CardTitle>
                <CardDescription>Enter a retrospective ID to join an existing session</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="yourName">Your Name</Label>
                  <Input
                    id="yourName"
                    placeholder="e.g. John Developer"
                    value={yourName}
                    onChange={(e) => setYourName(e.target.value)}
                    className="bg-secondary text-pornoretro-gray"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="retroId">Retrospective ID</Label>
                  <Input
                    id="retroId"
                    placeholder="Enter the 8-character ID"
                    value={retroId}
                    onChange={(e) => setRetroId(e.target.value)}
                    className="bg-secondary text-pornoretro-gray"
                    required
                  />
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange"
                >
                  Join Retrospective
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          {recentRetros.length > 0 && (
            <Card className="border-pornoretro-orange/30">
              <CardHeader>
                <CardTitle className="text-xl text-pornoretro-orange">Recent Retrospectives</CardTitle>
                <CardDescription>Quick access to recent sessions</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {recentRetros.map(retro => (
                    <div key={retro.id} className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                      <div>
                        <h4 className="font-medium">{retro.name}</h4>
                        <p className="text-sm text-muted-foreground">{retro.team} • {formatDate(retro.createdAt)}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-pornoretro-orange text-pornoretro-orange hover:bg-pornoretro-orange hover:text-pornoretro-black"
                        onClick={() => handleJoinRecent(retro.id)}
                      >
                        Join
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Join;
