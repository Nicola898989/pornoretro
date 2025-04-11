
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Play, Star, ThumbsUp, Users } from 'lucide-react';

const Index: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-pornoretro-black">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-pornoretro-black to-background">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-white">SPRINT RETROSPECTIVES</span>
              <br />
              <span className="text-pornoretro-orange glow-on-hover">HOT AND UNCENSORED</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
              Where your team's most intimate desires and frustrations are shared in a safe, anonymized environment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange text-lg py-6 px-8"
                onClick={() => navigate('/new-retro')}
              >
                Create New Retrospective
              </Button>
              <Button 
                variant="outline" 
                className="border-pornoretro-orange text-pornoretro-orange hover:bg-pornoretro-orange hover:text-pornoretro-black transition-colors text-lg py-6 px-8"
                onClick={() => navigate('/join')}
              >
                Join Existing Session
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-pornoretro-orange">
              NOT YOUR TYPICAL RETROSPECTIVE
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-secondary p-6 rounded-lg text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-pornoretro-orange w-16 h-16 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-pornoretro-black" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Anonymous Sharing</h3>
                <p className="text-muted-foreground">Express your true feelings without fear of judgment or retribution.</p>
              </div>
              
              <div className="bg-secondary p-6 rounded-lg text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-pornoretro-orange w-16 h-16 rounded-full flex items-center justify-center">
                    <ThumbsUp className="h-8 w-8 text-pornoretro-black" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Hot Voting</h3>
                <p className="text-muted-foreground">Vote on the issues that matter most to bring them to climax.</p>
              </div>
              
              <div className="bg-secondary p-6 rounded-lg text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-pornoretro-orange w-16 h-16 rounded-full flex items-center justify-center">
                    <Star className="h-8 w-8 text-pornoretro-black" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Team Fantasies</h3>
                <p className="text-muted-foreground">Turn your wildest improvement ideas into actionable tasks.</p>
              </div>
              
              <div className="bg-secondary p-6 rounded-lg text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-pornoretro-orange w-16 h-16 rounded-full flex items-center justify-center">
                    <Play className="h-8 w-8 text-pornoretro-black" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Action Tracking</h3>
                <p className="text-muted-foreground">Follow through on promises with our satisfaction guarantee.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-background to-pornoretro-black">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              READY TO GET <span className="text-pornoretro-orange">SATISFIED?</span>
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of teams who've discovered the pleasure of honest retrospectives.
            </p>
            <Button 
              className="bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange text-lg py-6 px-8"
              onClick={() => navigate('/new-retro')}
            >
              Start Your First Session Now
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
