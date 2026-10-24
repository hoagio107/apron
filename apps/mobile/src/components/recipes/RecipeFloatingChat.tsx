import { useState, useRef, useEffect } from 'react';
import { Button, Input, ScrollShadow } from '@/ui';
import { MessageSquare, X, Send, Sparkles, Loader2, Play } from 'lucide-react';
import { askGemini } from '../../lib/geminiChat';
import { GEMINI_MODELS } from '../../lib/gemini';
import type { Recipe } from '@apron/core';

interface RecipeFloatingChatProps {
  recipe: Recipe;
  onStartCooking?: () => void;
}

export function RecipeFloatingChat({ recipe, onStartCooking }: RecipeFloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      // Build context from recipe
      const recipeContext = `
Tên món: ${recipe.title}
Nguyên liệu:
${recipe.ingredients.map((ing: any) => `- ${ing.name}: ${ing.quantity} ${ing.unit}`).join('\n')}
Cách làm:
${recipe.steps.map((s: any, i: number) => `Bước ${i + 1}: ${s.instruction}`).join('\n')}
      `;

      const apiKey = localStorage.getItem('gemini_api_key') || '';
      
      const response = await askGemini(
        GEMINI_MODELS[0].name,
        `Người dùng hỏi về công thức nấu ăn. Hãy trả lời ngắn gọn, thân thiện và hữu ích.
        Context công thức:
        ${recipeContext}
        
        Câu hỏi: ${userMsg}`,
        apiKey
      );

      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Xin lỗi, tôi đang gặp lỗi kết nối. Bạn thử lại sau nhé!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col w-full h-[100dvh] pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-sm z-10 pt-safe">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold">Trợ lý AI Bếp trưởng</h3>
            </div>
            <Button isIconOnly size="md" variant="light" className="text-white active:bg-white/20" onPress={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <ScrollShadow ref={scrollRef} className="flex-1 p-4 bg-default-50/50 flex flex-col gap-4 overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-center text-default-500 my-auto pb-4">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Bạn cần trợ giúp gì về công thức này?</p>
                <p className="text-sm mt-1">VD: Có thể thay thế nguyên liệu này bằng gì?</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-sm' 
                    : 'bg-content1 border border-divider text-foreground rounded-tl-sm shadow-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-content1 border border-divider rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                  <div className="w-2 h-2 rounded-full bg-default-300 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-default-300 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 rounded-full bg-default-300 animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
          </ScrollShadow>
          
          <div className="p-3 bg-content1 border-t border-divider pb-safe">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <Input
                value={input}
                onValueChange={setInput}
                placeholder="Hỏi về công thức..."
                size="md"
                className="flex-1"
                classNames={{ inputWrapper: "bg-default-100 shadow-none" }}
              />
              <Button 
                isIconOnly 
                color="primary" 
                type="submit" 
                isDisabled={!input.trim() || isLoading}
                className="shrink-0 rounded-xl"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </div>
      )}
      
      {!isOpen && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 dark:bg-content1/80 backdrop-blur-md border-t border-divider z-40 safe-area-inset-bottom flex items-center gap-3 animate-appearance-in pb-6">
          <Button 
            color="primary" 
            variant="flat"
            className="flex-1 rounded-full font-bold h-12 text-primary-700 dark:text-primary-300 dark:bg-primary-500/20 border border-primary-200/50 dark:border-primary-400/20"
            onPress={() => setIsOpen(true)}
            startContent={<Sparkles className="w-5 h-5 text-primary-500 dark:text-primary-300" />}
          >
            Hỏi AI
          </Button>
          {onStartCooking && (
            <Button 
              color="primary"
              className="flex-1 rounded-full font-bold h-12 shadow-md shadow-primary/30"
              onPress={onStartCooking}
              startContent={<Play className="w-5 h-5 fill-current" />}
            >
              Bắt đầu nấu
            </Button>
          )}
        </div>
      )}
    </>
  );
}
