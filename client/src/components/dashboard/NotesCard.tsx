import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Edit3, Save, X } from "lucide-react";
import { Task } from "@/types/task";

interface NotesCardProps {
  task: Task;
  onUpdateNotes: (notes: string) => void;
  loading?: boolean;
}

const NotesCard: React.FC<NotesCardProps> = ({
  task,
  onUpdateNotes,
  loading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(task.notes || "");
  const [tempNotes, setTempNotes] = useState(task.notes || "");

  const handleStartEdit = () => {
    setTempNotes(notes);
    setIsEditing(true);
  };

  const handleSave = () => {
    setNotes(tempNotes);
    onUpdateNotes(tempNotes);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempNotes(notes);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <CardTitle>Notes</CardTitle>
          {notes && !isEditing && (
            <Badge variant="secondary" className="text-xs">
              {notes.length} characters
            </Badge>
          )}
        </div>

        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartEdit}
            className="h-8 w-8 p-0"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="text-xs md:text-sm text-muted-foreground mb-2">
        {isEditing
          ? "Add notes, progress updates, or reminders for this task."
          : "Personal notes and updates for this task."}
      </div>

      <CardContent>
        {isEditing ? (
          <div className="space-y-3" style={{ minHeight: "80vh", marginLeft: '-20px', marginRight: '-20px' }}>
            <Textarea
              className="resize-none"
              style={{ minHeight: "80vh", padding: 0 }}
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add your notes here... "
              rows={8}
              maxLength={2000}
              autoFocus
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {tempNotes.length}/2000 characters
                {tempNotes.length > 0 && (
                  <span className="ml-2">
                    Press Ctrl+Enter to save, Esc to cancel
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={loading}>
                  <Save className="h-4 w-4 mr-1" />
                  {loading ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {notes ? (
              <div
                className="space-y-2"
                style={{ minHeight: "80%", marginLeft: '-20px', marginRight: '-20px'}}
              >
                <div
                  className="text-sm whitespace-pre-wrap bg-muted/30 rounded-lg border p-2"
                  style={{ minHeight: "80vh", padding: 0 }}
                >
                  {notes}
                </div>
                <div className="text-xs text-muted-foreground">
                  Last updated:{" "}
                  {task.updated_at
                    ? new Date(task.updated_at).toLocaleString()
                    : "Never"}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">No notes yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartEdit}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Add Notes
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </div>
  );
};

export default NotesCard;
