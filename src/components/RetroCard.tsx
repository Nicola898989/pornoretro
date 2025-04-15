import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle, PlusCircle, Pencil, Trash, Check, X, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type CardType = 'hot' | 'disappointment' | 'fantasy';

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface RetroCardProps {
  id: string;
  type: CardType;
  content: string;
  author: string;
  votes: number;
  comments?: Comment[];
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
}

const cardStyles = {
  hot: "border-green-500 bg-gradient-to-br from-pornoretro-black to-green-950",
  disappointment: "border-red-500 bg-gradient-to-br from-pornoretro-black to-red-950",
  fantasy: "border-pornoretro-orange bg-gradient-to-br from-pornoretro-black to-pornoretro-darkorange/30"
};

const cardTitles = {
  hot: "Hot Moment",
  disappointment: "Disappointment",
  fantasy: "Team Fantasy"
};

const RetroCard: React.FC<RetroCardProps> = ({ 
  id, 
  type, 
  content, 
  author, 
  votes,
  comments = [],
  onVote,
  onAddComment,
  onCreateAction,
  onEditComment,
  onDeleteComment,
  onDrop,
  onRemoveFromGroup,
  hasVoted,
  currentUser = '',
  inGroup = false 
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(id, newComment.trim());
      setNewComment('');
    }
  };
  
  const startEditComment = (commentId: string, content: string) => {
    setEditingComment(commentId);
    setEditedContent(content);
  };
  
  const cancelEditComment = () => {
    setEditingComment(null);
    setEditedContent('');
  };
  
  const saveEditComment = (commentId: string) => {
    if (onEditComment && editedContent.trim()) {
      onEditComment(id, commentId, editedContent.trim());
      setEditingComment(null);
      setEditedContent('');
    }
  };
  
  const handleDeleteComment = (commentId: string) => {
    if (onDeleteComment) {
      onDeleteComment(id, commentId);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('card_id', id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.6';
    }
    
    console.log(`Started dragging card: ${id}`);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    
    console.log(`Finished dragging card: ${id}`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (inGroup || !onDrop) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add('drag-over');
    }
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove('drag-over');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (inGroup || !onDrop) return;
    
    e.preventDefault();
    const draggedCardId = e.dataTransfer.getData('card_id');
    
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove('drag-over');
    }
    
    if (draggedCardId && draggedCardId !== id && onDrop) {
      console.log(`Dropping card ${draggedCardId} onto card ${id}`);
      onDrop(draggedCardId, id);
    }
  };
  
  return (
    <Card 
      className={cn(
        "border-2 transition-all", 
        cardStyles[type],
        isDragging ? "opacity-60 scale-95" : "",
        inGroup ? "border-opacity-70" : "",
        "hover:border-opacity-100"
      )}
      draggable={!inGroup}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          {inGroup && onRemoveFromGroup && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0 text-muted-foreground hover:text-white"
              onClick={onRemoveFromGroup}
              title="Remove from group"
            >
              <LogOut className="w-3 h-3" />
            </Button>
          )}
          <CardDescription>
            Posted by {author}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="text-md">
        {content}
      </CardContent>
      <CardFooter className="flex flex-col gap-1 pt-2">
        <div className="flex items-center justify-between w-full text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              {comments.length}
            </button>
            <button
              onClick={() => onCreateAction(id)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <PlusCircle className="w-3 h-3" />
              Action
            </button>
          </div>
          <button 
            className={cn(
              "flex items-center gap-1 transition-colors",
              hasVoted ? "text-pornoretro-orange" : "text-muted-foreground hover:text-pornoretro-orange"
            )}
            onClick={() => onVote(id)}
          >
            <ThumbsUp className="w-3 h-3" />
            {votes}
          </button>
        </div>
        
        {showComments && (
          <div className="w-full pt-3 border-t border-muted">
            <div className="space-y-3 max-h-60 overflow-y-auto mb-2">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-secondary/50 p-3 rounded-md">
                    {editingComment === comment.id ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <p className="text-xs font-medium text-pornoretro-orange">{comment.author}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="min-h-[60px] bg-secondary/50 text-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={cancelEditComment}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange text-xs"
                            onClick={() => saveEditComment(comment.id)}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <p className="text-xs font-medium text-pornoretro-orange">{comment.author}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()}
                            </p>
                            {(comment.author === currentUser || comment.author === "Anonymous") && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                      <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                    </svg>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => startEditComment(comment.id, comment.content)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)}>
                                    <Trash className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px] bg-secondary/50 text-sm"
              />
              <Button 
                type="submit"
                size="sm" 
                className="bg-pornoretro-orange text-pornoretro-black hover:bg-pornoretro-darkorange self-end"
              >
                Comment
              </Button>
            </form>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default RetroCard;
