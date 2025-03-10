
import { Link, useLocation } from "react-router-dom";
import { FileText, Home, PieChart, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: "Home", path: "/", icon: <Home size={18} /> },
    { name: "Dashboard", path: "/dashboard", icon: <PieChart size={18} /> },
    { name: "Feedback", path: "/feedback", icon: <FileText size={18} /> },
  ];

  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-lg shadow-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <FileText className="h-6 w-6" />
            <span className="font-bold text-xl tracking-tight">ResumeWisdom</span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-8">
            <motion.div 
              className="flex space-x-4"
              initial="hidden"
              animate="visible"
              variants={navVariants}
            >
              {navItems.map((item) => (
                <motion.div key={item.name} variants={itemVariants}>
                  <NavLink to={item.path} active={location.pathname === item.path}>
                    <span className="flex items-center gap-1.5">
                      {item.icon}
                      {item.name}
                    </span>
                  </NavLink>
                </motion.div>
              ))}
            </motion.div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-card/95 backdrop-blur-lg border-t border-border"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  active={location.pathname === item.path}
                  mobile
                >
                  <span className="flex items-center gap-2">
                    {item.icon}
                    {item.name}
                  </span>
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

type NavLinkProps = {
  to: string;
  active: boolean;
  mobile?: boolean;
  children: React.ReactNode;
};

const NavLink = ({ to, active, mobile = false, children }: NavLinkProps) => {
  const baseClasses = "transition-all duration-200";
  
  const mobileClasses = mobile
    ? "block px-3 py-2.5 rounded-md text-base font-medium"
    : "inline-flex items-center px-1 pt-1 font-medium text-sm";
  
  const activeClasses = active
    ? "text-purple-400 hover:text-purple-300"
    : "text-muted-foreground hover:text-foreground";

  return (
    <Link to={to} className={`${baseClasses} ${mobileClasses} ${activeClasses}`}>
      {children}
    </Link>
  );
};
