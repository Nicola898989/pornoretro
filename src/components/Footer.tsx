
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-pornoretro-black border-t border-pornoretro-orange/30 p-4 text-sm">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <p>&copy; {new Date().getFullYear()} PORNORETRO.IT - Professional Retrospectives with a Twist</p>
        </div>
        <div className="flex gap-4">
          <a href="#" className="text-pornoretro-orange hover:underline">About</a>
          <a href="#" className="text-pornoretro-orange hover:underline">Terms</a>
          <a href="#" className="text-pornoretro-orange hover:underline">Privacy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
