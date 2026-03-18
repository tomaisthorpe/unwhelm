"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Archive, RotateCcw } from "lucide-react";
import type { Context } from "@/lib/data";
import { getContextIconComponent } from "@/lib/context-icons";
import { unarchiveContextAction } from "@/lib/server-actions";

interface ArchivedContextsProps {
  archivedContexts: Context[];
  isOpen: boolean;
  onClose: () => void;
  onDataChange?: () => void;
}

export function ArchivedContexts({ archivedContexts, isOpen, onClose, onDataChange }: ArchivedContextsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUnarchiveContext = async (contextId: string) => {
    setIsLoading(contextId);
    setError(null);

    try {
      await unarchiveContextAction(contextId);
      // Trigger immediate data refresh
      onDataChange?.();
    } catch (error) {
      console.error("Failed to unarchive context:", error);
      setError(error instanceof Error ? error.message : "Failed to unarchive context");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="bg-white dark:bg-gray-900 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Archive className="w-5 h-5 mr-2" />
            Archived Contexts
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {archivedContexts.length === 0 ? (
          <div className="text-center py-8">
            <Archive className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No archived contexts yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {archivedContexts.map((context) => {
              const IconComponent = getContextIconComponent(context.icon);
              const isUnarchiving = isLoading === context.id;

              return (
                <div 
                  key={context.id} 
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${context.color}`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{context.name}</h3>
                      {context.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{context.description}</p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Archived on {new Date(context.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnarchiveContext(context.id)}
                    disabled={isUnarchiving}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    {isUnarchiving ? "Unarchiving..." : "Unarchive"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}