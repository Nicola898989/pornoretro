
import React, { useEffect } from 'react';
import { useLocation, Link } from "react-router-dom";
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const NotFound: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-pornoretro-black">
      <Header />
      
      <main className="flex-grow flex items-center justify-center container mx-auto py-16 px-4 text-center">
        <div>
          <h1 className="text-6xl font-bold mb-4 text-pornoretro-orange">404</h1>
          <p className="text-2xl mb-8 max-w-md mx-auto">Oops! This page doesn't exist. Maybe you're looking for something else that will satisfy you?</p>
          <Button 
            asChild
            className="bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange"
          >
            <Link to="/">Back to Home Page</Link>
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;
