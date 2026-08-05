"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Đồng ý",
  cancelText = "Hủy bỏ",
  variant = "destructive"
}: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-[2.5rem] p-6 md:p-8 border-none shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center space-y-4">
          <div className={cn(
            "w-16 h-16 rounded-3xl flex items-center justify-center mb-2",
            variant === "destructive" ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"
          )}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          <DialogTitle className="text-2xl font-bold font-headline">{title}</DialogTitle>
          <DialogDescription className="text-gray-500 leading-relaxed">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button 
            variant="secondary" 
            onClick={onClose} 
            className="flex-1 rounded-2xl h-12 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors border-none shadow-none"
          >
            {cancelText}
          </Button>
          <Button 
            onClick={() => { onConfirm(); onClose(); }}
            className={cn(
              "flex-1 rounded-2xl h-12 font-bold shadow-none transition-transform active:scale-95 border-none",
              variant === "destructive" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-orange-600 hover:bg-orange-700 text-white"
            )}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
