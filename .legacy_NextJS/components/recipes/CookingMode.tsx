"use client";

import { useState, useRef, useEffect } from 'react';
import { Recipe } from '@/lib/recipe-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  X, ChevronLeft, ChevronRight, 
  Sparkles, Send, Loader2, 
  MessageCircle, ChefHat, 
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { askRecipeQuestion } from '@/ai/flows/recipe-chat-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
}

export function CookingMode({ recipe, onClose }: CookingModeProps) {
  const isMobile = useIsMobile();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const steps = recipe.steps || [];
  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isAIChatOpen) scrollToBottom();
  }, [chatHistory, isAIChatOpen]);

  const handleAskAI = async () => {
    if (!question.trim() || isAsking) return;

    const userMsg = question.trim();
    setQuestion('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAsking(true);

    try {
      const response = await askRecipeQuestion({
        recipeTitle: recipe.title,
        ingredients: recipe.ingredients.map(i => `${i.quantity} ${i.unit} ${i.name}`).join('\n'),
        currentStep: currentStep?.instruction || '',
        allSteps: steps.map((s, i) => `${i + 1}. ${s.instruction}`).join('\n'),
        question: userMsg
      });

      setChatHistory(prev => [...prev, { role: 'ai', text: response }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Xin lỗi, trợ lý AI đang bận một chút. Bạn thử lại nhé!' }]);
    } finally {
      setIsAsking(false);
    }
  };

  // Shared Header Component
  const Header = () => (
    <header className="relative flex items-center justify-between px-4 md:px-6 h-14 md:h-16 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
      {/* Progress Bar fixed at top of header */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-800">
        <div 
          className="h-full bg-orange-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
          <ChefHat className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-bold text-xs md:text-sm truncate max-w-[180px] md:max-w-md font-headline">{recipe.title}</h2>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
            Bước {currentStepIndex + 1} / {steps.length}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10">
        <X className="w-5 h-5 md:w-6 md:h-6" />
      </Button>
    </header>
  );

  // Shared AI Chat Content
  const AIChatPanel = () => (
    <div className={cn(
      "flex flex-col bg-white dark:bg-gray-900 transition-all duration-300",
      isMobile 
        ? "fixed inset-0 z-50 animate-in slide-in-from-bottom duration-300" 
        : cn("w-96 border-l border-gray-100 dark:border-gray-800", !isAIChatOpen && "w-0 overflow-hidden border-none")
    )}>
      <div className="p-4 border-b flex items-center justify-between bg-white dark:bg-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span className="font-bold text-sm">Hỏi Trợ lý CookPal</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsAIChatOpen(false)} className="rounded-xl h-9 w-9"><X className="w-4 h-4" /></Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pb-4">
          {chatHistory.length === 0 && (
            <div className="py-10 text-center space-y-3 opacity-50">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
                <MessageCircle className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium px-6 leading-relaxed">Đừng ngần ngại hỏi về việc thay thế nguyên liệu hoặc cách xử lý khi nấu lỗi nhé!</p>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={cn(
              "max-w-[85%] p-3 md:p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
              msg.role === 'user' 
                ? "bg-orange-500 text-white ml-auto rounded-tr-none" 
                : "bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 mr-auto rounded-tl-none font-medium text-gray-700 dark:text-gray-300"
            )}>
              {msg.text}
            </div>
          ))}
          {isAsking && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 mr-auto p-3 rounded-2xl rounded-tl-none shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0">
        <div className="flex gap-2">
          <Input 
            placeholder="Hỏi AI..." 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            className="bg-gray-50 dark:bg-gray-900 border-none rounded-xl h-11 font-bold shadow-none"
          />
          <Button onClick={handleAskAI} disabled={isAsking || !question.trim()} className="bg-orange-600 hover:bg-orange-700 h-11 w-11 p-0 rounded-xl shrink-0 border-none shadow-none text-white">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const MobileView = () => (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
      <Header />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8 pb-32">
          <div className="space-y-4">
            {currentStep?.group && currentStep.group !== 'Thực hiện' && (
              <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                {currentStep.group}
              </span>
            )}
            <h1 className="text-xl font-bold leading-tight text-gray-800 dark:text-white font-headline">
              {currentStep?.instruction}
            </h1>
          </div>

          {currentStep?.images && currentStep.images.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {currentStep.images.map((img, i) => (
                <img key={i} src={img} className="rounded-2xl w-full aspect-video object-cover shadow-md border border-gray-100 dark:border-gray-800" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button for AI on Mobile */}
      {!isAIChatOpen && (
        <Button 
          onClick={() => setIsAIChatOpen(true)}
          className="fixed bottom-24 right-6 w-12 h-12 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-500/30 z-40 flex items-center justify-center p-0 border-none"
        >
          <Sparkles className="w-5 h-5" />
        </Button>
      )}

      {isAIChatOpen && <AIChatPanel />}

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 z-30">
        <Button 
          variant="outline" 
          disabled={currentStepIndex === 0}
          onClick={() => setCurrentStepIndex(prev => prev - 1)}
          className="rounded-xl h-12 px-4 font-bold border-gray-200 flex-1 shadow-none"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Trước
        </Button>

        {currentStepIndex < steps.length - 1 ? (
          <Button 
            onClick={() => setCurrentStepIndex(prev => prev + 1)}
            className="rounded-xl h-12 px-6 font-bold bg-orange-600 hover:bg-orange-700 text-white flex-[2] border-none shadow-none"
          >
            Bước tiếp <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button 
            onClick={onClose}
            className="rounded-xl h-12 px-6 font-bold bg-green-600 hover:bg-green-700 text-white flex-[2] border-none shadow-none"
          >
            <CheckCircle2 className="w-4 h-4 mr-1" /> Hoàn tất
          </Button>
        )}
      </div>
    </div>
  );

  const DesktopView = () => (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col items-center overflow-y-auto p-12">
          <div className="max-w-3xl w-full space-y-12">
            <div className="space-y-6">
              {currentStep?.group && currentStep.group !== 'Thực hiện' && (
                <span className="inline-block px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black uppercase tracking-widest">
                  {currentStep.group}
                </span>
              )}
              <h1 className="text-5xl font-bold leading-tight text-gray-900 dark:text-white font-headline">
                {currentStep?.instruction}
              </h1>
            </div>

            {currentStep?.images && currentStep.images.length > 0 && (
              <div className="grid grid-cols-2 gap-6">
                {currentStep.images.map((img, i) => (
                  <div key={i} className="aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800">
                    <img src={img} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="pt-12 flex items-center justify-between gap-6">
              <Button 
                variant="outline" 
                size="lg"
                disabled={currentStepIndex === 0}
                onClick={() => setCurrentStepIndex(prev => prev - 1)}
                className="rounded-2xl h-16 px-10 font-bold border-2 bg-white dark:bg-gray-800 shadow-none hover:bg-gray-50"
              >
                <ChevronLeft className="w-6 h-6 mr-2" /> Quay lại bước trước
              </Button>

              {currentStepIndex < steps.length - 1 ? (
                <Button 
                  size="lg"
                  onClick={() => setCurrentStepIndex(prev => prev + 1)}
                  className="rounded-2xl h-16 px-12 font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-500/20 border-none transition-transform hover:scale-105 active:scale-95"
                >
                  Bước tiếp theo <ChevronRight className="w-6 h-6 ml-2" />
                </Button>
              ) : (
                <Button 
                  size="lg"
                  onClick={onClose}
                  className="rounded-2xl h-16 px-12 font-bold bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-500/20 border-none transition-transform hover:scale-105 active:scale-95"
                >
                  <CheckCircle2 className="w-6 h-6 mr-2" /> Hoàn thành nấu ăn
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar Chat */}
        <AIChatPanel />
      </div>

      {/* Floating Toggle AI for Desktop when sidebar is hidden */}
      {!isAIChatOpen && (
        <Button 
          onClick={() => setIsAIChatOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-3xl bg-orange-600 hover:bg-orange-700 text-white shadow-2xl shadow-orange-500/40 z-50 flex items-center justify-center p-0 border-none transition-all hover:scale-110 active:scale-95"
        >
          <Sparkles className="w-8 h-8" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] animate-in fade-in duration-300">
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
}
