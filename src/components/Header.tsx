
import React from 'react';
import Logo from './Logo';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="w-full bg-pornoretro-black border-b border-pornoretro-orange/30 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Logo />
        <div className="flex gap-4">
          <Button 
            variant="outline"
            className="border-pornoretro-orange text-pornoretro-orange hover:bg-pornoretro-orange hover:text-pornoretro-black transition-colors"
            onClick={() => navigate('/new-retro')}
          >
            Create Hot Retrospective
          </Button>
          <Button 
            className="bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange"
            onClick={() => navigate('/join')}
          >
            Join Now
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
