
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

const NewRetro: React.FC = () => {
  const [retroName, setRetroName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [yourName, setYourName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const generateRandomId = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!retroName.trim() || !teamName.trim() || !yourName.trim()) {
      toast({
        title: "Modulo incompleto",
        description: "Per favore, compila tutti i campi richiesti",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Generate a unique ID for the retrospective
      const retroId = generateRandomId();
      
      // Store the user as the creator
      localStorage.setItem('currentUser', yourName.trim());
      
      // Create retrospective using the API
      const response = await fetch('/api/retro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: retroId,
          name: retroName.trim(),
          team: teamName.trim(),
          created_by: yourName.trim(),
          is_anonymous: isAnonymous
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create retrospective');
      }

      const retroData = await response.json();
      
      console.log("Retrospettiva salvata con successo:", retroData);
      
      toast({
        title: "Retrospettiva creata!",
        description: "La tua nuova retrospettiva è pronta",
      });
      
      navigate(`/retro/${retroId}`);
    } catch (error) {
      console.error("Errore nella creazione della retrospettiva:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore nella creazione della retrospettiva. Riprova più tardi.",
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
                <CardTitle className="text-2xl text-pornoretro-orange">Create New Retrospective</CardTitle>
                <CardDescription>Get your team hot and ready for an honest review</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="retroName">Retrospective Title</Label>
                  <Input
                    id="retroName"
                    placeholder="e.g. Sprint 42 Retrospective"
                    value={retroName}
                    onChange={(e) => setRetroName(e.target.value)}
                    className="bg-secondary text-pornoretro-gray"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    placeholder="e.g. Backend Pleasure Team"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="bg-secondary text-pornoretro-gray"
                    required
                  />
                </div>
                
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
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="anonymity" className="font-medium text-sm">Make feedback anonymous</Label>
                  <Switch 
                    id="anonymity"
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                  />
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                  <Lock className="h-4 w-4" />
                  <p>{isAnonymous ? "All participant feedback will remain anonymous" : "Feedback will include participants' names"}</p>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Retrospective'}
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

export default NewRetro;
