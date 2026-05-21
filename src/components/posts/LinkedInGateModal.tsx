import { Linkedin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LinkedInGateModalProps {
  onDismiss: () => void;
}

export function LinkedInGateModal({ onDismiss }: LinkedInGateModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md text-center"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[#0a66c2]/10 flex items-center justify-center">
            <Linkedin className="h-7 w-7 text-[#0a66c2]" />
          </div>
          <div className="space-y-1.5">
            <DialogTitle className="text-xl">
              Connect LinkedIn to unlock everything
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              To create, schedule, and publish posts you need to connect your
              LinkedIn account first. It only takes a few seconds.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-2">
          <Button
            className="w-full bg-[#0a66c2] hover:bg-[#004182] text-white"
            onClick={() => navigate('/dashboard/linkedin-vault')}
          >
            Connect LinkedIn
          </Button>
          <Button variant="ghost" className="w-full" onClick={onDismiss}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
