import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PenLine, LogOut, BookOpen, User as UserIcon } from 'lucide-react';

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const profileMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-primary/10 p-0"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user?.name || 'Profile'}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span className="font-medium text-primary">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/my-blogs" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            My Blogs
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/my-profile" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-5xl px-4 py-3 sm:hidden">
        {!isAuthenticated && (
          <>
            <div className="flex items-center justify-end gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/register">Sign up</Link>
              </Button>
            </div>
            <div className="my-2 border-t border-border/35" />
          </>
        )}

        {isAuthenticated && <div className="my-1 border-t border-border/20" />}

        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="flex items-center gap-2 truncate font-serif text-xl font-semibold tracking-tight text-foreground">
              Meowwdium
              <img src="/paws.png" alt="Meowwdium" className="h-7 w-7 shrink-0" />
            </span>
          </Link>

          <nav className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/about">About</Link>
            </Button>
            {isAuthenticated ? (
              profileMenu
            ) : (
              <Button asChild size="sm">
                <Link to="/register">Get started</Link>
              </Button>
            )}
          </nav>
        </div>
      </div>

      <div className="mx-auto hidden h-16 max-w-5xl items-center justify-between px-4 sm:flex">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex items-center justify-center gap-2 font-serif text-2xl font-semibold tracking-tight text-foreground">
            Meowwdium
            <img src="/paws.png" alt="Meowwdium" className="inline-block h-8 w-8 align-middle" />
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/about">About</Link>
          </Button>
          {isAuthenticated ? (
            <>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link to="/write" className="flex items-center gap-2">
                  <PenLine className="h-4 w-4" />
                  <span>Write</span>
                </Link>
              </Button>
              {profileMenu}
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
