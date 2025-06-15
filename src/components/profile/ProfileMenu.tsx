
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Briefcase, LogOut, User, UserCog } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function ProfileMenu() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      console.log("ProfileMenu: Initiating sign out process");
      
      // Perform sign out
      await signOut();
      
      console.log("ProfileMenu: Sign out successful, forcing navigation");
      
      // Force a complete page reload to ensure clean state
      window.location.href = "/index";
      
    } catch (error) {
      console.error("ProfileMenu: Error during sign out:", error);
      // Force navigation even on error
      window.location.href = "/index";
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span>My Account</span>
          <span className="text-xs font-normal text-muted-foreground">
            {user?.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserCog className="mr-2 h-4 w-4" />
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/organization-settings")}>
          <Briefcase className="mr-2 h-4 w-4" />
          Organizations
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut} 
          disabled={isLoading}
          className={isLoading ? "opacity-50 cursor-not-allowed" : ""}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoading ? "Signing Out..." : "Sign Out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
