import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      {/* Reading image background */}
      <div className="absolute inset-0 opacity-20">
        <img 
          src="/lovable-uploads/321814b4-20b0-4dc2-9a90-0dc7028858eb.png"
          alt="Happy child reading"
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto px-6">
        <div className="glass rounded-3xl p-8 backdrop-blur-2xl">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src="/lovable-uploads/edb17c97-cd98-4e14-8d30-629ad18e76b0.png" 
              alt="Book Hive Logo" 
              className="w-16 h-16 mx-auto object-contain opacity-90"
            />
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold text-primary mb-4 animate-scale-in">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Looks like this page went on a reading adventure and got lost in the stacks. 
            Let's help you find your way back to the books!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              className="btn-primary hover-lift gap-2"
              onClick={() => navigate('/')}
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
            <Button 
              variant="outline" 
              className="glass border-white/20 hover-lift gap-2"
              onClick={() => navigate('/client')}
            >
              <Search className="w-4 h-4" />
              Browse Books
            </Button>
            <Button 
              variant="ghost" 
              className="hover-lift gap-2"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </div>
          
          {/* Fun fact about books */}
          <div className="mt-8 p-4 bg-primary/10 rounded-2xl border border-primary/20">
            <p className="text-sm text-primary/80">
              💡 <strong>Did you know?</strong> The average person reads about 12 books per year. 
              Why not start your next one with us?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
