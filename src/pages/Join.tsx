
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

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
        title: "Modulo incompleto",
        description: "Per favore, inserisci tutti i campi richiesti",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const providedId = retroId.trim();
      
      // Check if the retrospective exists using the API
      const response = await fetch(`/api/retro/${providedId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Retrospettiva non trovata",
            description: "Controlla l'ID e riprova",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Errore nel trovare la retrospettiva",
            description: "Si è verificato un errore imprevisto",
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }
      
      const retroData = await response.json();
      
      // Store the current user name in localStorage
      localStorage.setItem("currentUser", yourName.trim());
      
      toast({
        title: "Entrato con successo!",
        description: "Benvenuto nella retrospettiva",
      });
      
      navigate(`/retro/${providedId}`);
    } catch (error) {
      console.error("Impossibile accedere alla retrospettiva:", error);
      toast({
        title: "Errore nell'accesso alla retrospettiva",
        description: "Riprova più tardi",
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
                <CardTitle className="text-2xl text-pornoretro-orange">Entra nella Retrospettiva</CardTitle>
                <CardDescription>Inserisci l'ID di una retrospettiva esistente per partecipare</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="yourName">Il tuo nome</Label>
                  <Input
                    id="yourName"
                    placeholder="es. Mario Sviluppatore"
                    value={yourName}
                    onChange={(e) => setYourName(e.target.value)}
                    className="bg-secondary text-pornoretro-gray"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="retroId">ID Retrospettiva</Label>
                  <Input
                    id="retroId"
                    placeholder="Inserisci l'ID della retrospettiva"
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
                  {isLoading ? 'Entrando...' : 'Entra nella Retrospettiva'}
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
