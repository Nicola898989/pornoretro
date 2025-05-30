import React, { useState, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Plus, Edit, Trash2, Save, X, UserMinus } from 'lucide-react';
import { CardType, Comment } from '@/types/retro';
import { cn } from '@/lib/utils';
import CategorySelector from './CategorySelector';

interface RetroCardProps {
  id: string;
  type: CardType;
  content: string;
  author: string;
  votes: number;
  comments: Comment[];
  onVote: (id: string) => void;
  onAddComment: (id: string, content: string) => void;
  onCreateAction: (cardId: string) => void;
  onEditComment?: (cardId: string, commentId: string, newContent: string) => void;
  onDeleteComment?: (cardId: string, commentId: string) => void;
  onDrop?: (cardId: string, targetCardId: string) => void;
  onRemoveFromGroup?: () => void;
  hasVoted: boolean;
  currentUser?: string;
  inGroup?: boolean;
  onEdit?: (cardId: string, newContent: string) => void;
  onDelete?: (cardId: string) => void;
  onChangeCategory?: (cardId: string, newType: CardType) => void;
}

const RetroCard: React.FC<RetroCardProps> = ({
  id,
  type,
  content,
  author,
  votes,
  comments,
  onVote,
  onAddComment,
  onCreateAction,
  onEditComment,
  onDeleteComment,
  onDrop,
  onRemoveFromGroup,
  hasVoted,
  currentUser,
  inGroup = false,
  onEdit,
  onDelete,
  onChangeCategory,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newContent, setNewContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [commentContent, setCommentContent] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  const handleVote = () => {
    onVote(id);
  };

  const handleAddComment = () => {
    if (commentContent.trim()) {
      setIsAddingComment(true);
      onAddComment(id, commentContent.trim());
      setCommentContent('');
      setIsAddingComment(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setNewContent(content);
  };

  const handleSave = () => {
    if (newContent.trim() && onEdit) {
      onEdit(id, newContent.trim());
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(id);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDrop) {
      const cardId = e.dataTransfer.getData('card_id');
      onDrop(cardId, id);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('card_id', id);
  };

  const handleRemoveFromGroup = () => {
    if (onRemoveFromGroup) {
      onRemoveFromGroup();
    }
  };

  const handleCategoryChange = (newType: CardType) => {
    if (onChangeCategory) {
      onChangeCategory(id, newType);
    }
  };

  return (
    <Card 
      className={`bg-gradient-to-br from-pornoretro-black to-pornoretro-black/80 text-white border-2 border-pornoretro-darkorange ${inGroup ? 'opacity-80' : ''}`}
      draggable={!isEditing && !inGroup}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1 flex-1">
          <p className="text-xs text-muted-foreground">di {author}</p>
          {isEditing ? (
            <div className="flex flex-col space-y-2">
              <Textarea
                ref={textareaRef}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="bg-secondary/20 border-secondary/30 text-sm"
              />
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button variant="outline" size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed">{content}</p>
          )}
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          {onChangeCategory && (
            <CategorySelector
              currentType={type}
              onChangeCategory={handleCategoryChange}
              disabled={isEditing}
            />
          )}
          {!isEditing && currentUser === author && !inGroup && onEdit && (
            <Button variant="ghost" size="icon" onClick={handleEdit}>
              <Edit className="h-4 w-4 text-muted-foreground hover:text-pornoretro-orange" />
            </Button>
          )}
          {!isEditing && onDelete && (
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
            </Button>
          )}
          {inGroup && onRemoveFromGroup && (
            <Button variant="ghost" size="icon" onClick={handleRemoveFromGroup}>
              <UserMinus className="h-4 w-4 text-muted-foreground hover:text-red-500" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleVote} disabled={isEditing || hasVoted}>
            <Heart className={cn("h-4 w-4 mr-2", hasVoted ? 'text-red-500' : 'text-muted-foreground hover:text-red-500')} />
            <span>{votes} Voti</span>
          </Button>
          <div className="flex-1">
            <Textarea
              placeholder="Aggiungi un commento..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="bg-secondary/20 border-secondary/30 text-sm"
              disabled={isEditing}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleAddComment} disabled={isEditing || isAddingComment || !commentContent.trim()}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Commenta
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground px-4 py-2">
        {comments.length > 0 && (
          <div className="mt-2">
            {comments.map(comment => (
              <div key={comment.id} className="mb-1">
                <span className="font-semibold">{comment.author}:</span> {comment.content}
              </div>
            ))}
          </div>
        )}
        <Button variant="secondary" size="sm" className="mt-2" onClick={() => onCreateAction(id)}>
          <Plus className="h-4 w-4 mr-2" />
          Crea Action
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RetroCard;
