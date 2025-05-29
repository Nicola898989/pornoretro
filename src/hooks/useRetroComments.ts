
import { useToast } from "@/hooks/use-toast";
import * as retroService from '@/services/retroService';
import { RetroData } from '@/types/retro';

export const useRetroComments = () => {
  const { toast } = useToast();

  const handleAddComment = async (cardId: string, content: string, username: string, retroData: RetroData | null) => {
    if (!content.trim() || !username || !retroData) return;

    try {
      const author = retroData.is_anonymous ? 'Anonymous' : username;
      await retroService.addComment(cardId, content, author);

      toast({
        title: "Commento aggiunto",
        description: "Il tuo commento è stato aggiunto",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il commento. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const handleEditComment = async (cardId: string, commentId: string, newContent: string) => {
    if (!newContent.trim()) return;

    try {
      await retroService.editComment(commentId, newContent);

      toast({
        title: "Commento aggiornato",
        description: "Il tuo commento è stato modificato",
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il commento. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (cardId: string, commentId: string) => {
    try {
      await retroService.deleteComment(commentId);

      toast({
        title: "Commento eliminato",
        description: "Il commento è stato eliminato",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il commento. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  return {
    handleAddComment,
    handleEditComment,
    handleDeleteComment,
  };
};
