import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { startTour, type TourRole } from "@/lib/tour";

interface TourHelpButtonProps {
  userId: string;
  role: TourRole;
}

export function TourHelpButton({ userId, role }: TourHelpButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => startTour(userId, role)}
      className="gap-1.5 text-muted-foreground hover:text-foreground"
      data-tour="help-button"
      data-testid="button-tour-help"
      title="Refazer tour guiado"
    >
      <HelpCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Ajuda</span>
    </Button>
  );
}
