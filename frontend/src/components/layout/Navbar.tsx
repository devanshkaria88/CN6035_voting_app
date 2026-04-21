import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Sparkles, Vote, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import WalletButton from '@/components/wallet/WalletButton';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/candidates', label: 'Candidates' },
  { to: '/vote', label: 'Vote' },
  { to: '/results', label: 'Results' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { isAdmin, isDemo, demoVoterIndex } = useAuth();

  const links = isAdmin
    ? [...navLinks, { to: '/admin', label: 'Admin' }]
    : navLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Vote className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">ClassRep Vote</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Button
              key={link.to}
              variant="ghost"
              size="sm"
              render={<Link to={link.to} />}
              className={cn(
                location.pathname === link.to &&
                  'bg-accent text-accent-foreground'
              )}
            >
              {link.label}
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isDemo && (
            <Badge
              variant="secondary"
              className="hidden gap-1 sm:inline-flex"
              title="You are signed in with a seeded demo account"
            >
              <Sparkles className="h-3 w-3" />
              Demo
              {!isAdmin && demoVoterIndex !== null
                ? ` Voter #${demoVoterIndex + 1}`
                : isAdmin
                  ? ' Admin'
                  : ''}
            </Badge>
          )}
          <ThemeToggle />
          <div className="hidden md:block">
            <WalletButton />
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-primary" />
                ClassRep Vote
              </SheetTitle>
              <Separator className="my-4" />
              <nav className="flex flex-col gap-1">
                {links.map((link) => (
                  <Button
                    key={link.to}
                    variant="ghost"
                    className={cn(
                      'w-full justify-start',
                      location.pathname === link.to &&
                        'bg-accent text-accent-foreground'
                    )}
                    render={<Link to={link.to} />}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Button>
                ))}
              </nav>
              <Separator className="my-4" />
              <WalletButton />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
