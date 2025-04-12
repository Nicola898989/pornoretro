
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RetroInfo {
  id: string;
  name: string;
  team: string;
  createdAt: string;
}

const Join: React.FC = () => {
  const [retroId, setRetroId] = useState('');
  const [yourName, setYourName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if there's a stored user name and pre-fill
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setYourName(storedUser);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!retroId.trim() || !yourName.trim()) {
      toast({
        title: "Incomplete form",
        description: "Please fill in all the required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First check localStorage for backward compatibility
      const providedId = retroId.trim();
      const retroKey = `retro_${providedId}`;
      const localRetroData = localStorage.getItem(retroKey);
      
      if (localRetroData) {
        // Local retro exists, use it
        localStorage.setItem("currentUser", yourName.trim());
        
        toast({
          title: "Joined successfully!",
          description: "Welcome to the retrospective",
        });
        
        navigate(`/retro/${providedId}`);
        return;
      }
      
      // If no local retro, check Supabase
      console.log("Searching for retro with ID:", providedId);
      const { data: retroData, error } = await supabase
        .from('retrospectives')
        .select('*')
        .eq('id', providedId)
        .single();
      
      if (error) {
        console.error("Supabase error:", error);
        if (error.code === 'PGRST116') {
          toast({
            title: "Retrospective not found",
            description: "Please check the ID and try again",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error finding retrospective",
            description: "An unexpected error occurred",
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }
      
      if (!retroData) {
        toast({
          title: "Retrospective not found",
          description: "Please check the ID and try again",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Store the current user name in localStorage
      localStorage.setItem("currentUser", yourName.trim());
      
      toast({
        title: "Joined successfully!",
        description: "Welcome to the retrospective",
      });
      
      navigate(`/retro/${providedId}`);
    } catch (error) {
      console.error("Failed to join retrospective:", error);
      toast({
        title: "Error joining retrospective",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-pornoretro-black">
      <Header />
      
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto">
          <Card className="border-pornoretro-orange/30">
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
                    placeholder="Enter the retrospective ID"
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
                  disabled={isLoading}
                >
                  {isLoading ? 'Joining...' : 'Join Retrospective'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Join;
