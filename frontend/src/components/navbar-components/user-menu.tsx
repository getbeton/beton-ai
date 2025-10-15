'use client';

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LogOut,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * User Menu Component
 * 
 * Displays user avatar with dropdown menu for account actions.
 * Features:
 * - Shows user initials or profile picture from Supabase auth
 * - Logout functionality
 * - Navigation to auth page for account settings
 */
export default function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [initials, setInitials] = useState<string>('U');

  // Fetch user data from Supabase on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          
          // Generate initials from email or user metadata
          const userEmail = session.user.email || '';
          const userName = session.user.user_metadata?.full_name || 
                          session.user.user_metadata?.name || '';
          
          let userInitials = 'U'; // Default
          
          if (userName) {
            // Get initials from full name
            const nameParts = userName.split(' ').filter(Boolean);
            if (nameParts.length >= 2) {
              userInitials = nameParts[0][0] + nameParts[1][0];
            } else if (nameParts.length === 1) {
              userInitials = nameParts[0].slice(0, 2);
            }
          } else if (userEmail) {
            // Get initials from email
            const emailPart = userEmail.split('@')[0];
            userInitials = emailPart.slice(0, 2);
          }
          
          setInitials(userInitials.toUpperCase());
        }
      } catch (error) {
        console.error('[UserMenu] Error fetching user:', error);
      }
    };

    fetchUser();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      console.info('[UserMenu] Logging out user');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[UserMenu] Logout error:', error);
        toast.error('Failed to log out');
        return;
      }
      
      toast.success('Logged out successfully');
      router.push('/auth');
    } catch (error) {
      console.error('[UserMenu] Logout exception:', error);
      toast.error('Failed to log out');
    }
  };

  // Navigate to auth page for account management
  const handleAccountSettings = () => {
    router.push('/auth');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
          <Avatar>
            <AvatarImage 
              src={user?.user_metadata?.avatar_url} 
              alt={user?.user_metadata?.full_name || user?.email || "Profile image"} 
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-64" align="end">
        <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}
          </span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user?.email || 'No email'}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut size={16} className="opacity-60" aria-hidden="true" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
