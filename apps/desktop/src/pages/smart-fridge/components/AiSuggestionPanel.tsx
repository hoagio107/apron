import { useState } from 'react';
import { Button, Card, CardBody, Chip, Checkbox } from '@/ui';
import { Sparkles, Save, Clock, ChefHat, CheckCircle2, AlertCircle, ShoppingCart, BookOpen } from 'lucide-react';
import { suggestRecipesFromPantry, type SuggestedRecipe, GEMINI_MODELS } from '../../../lib/gemini';
import type { PantryItem, Recipe } from '@apron/core';
import { useRecipeStore } from '../../../store/useRecipeStore';
import { useShoppingListStore } from '../../../store/useShoppingListStore';
import { useNavigate } from 'react-router-dom';

interface AiSuggestionPanelProps {
  pantryItems: PantryItem[];
}

export function AiSuggestionPanel({ pantryItems }: AiSuggestionPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedRecipe[]>([]);
  const [useCookbook, setUseCookbook] = useState(true);
  const { recipes, addRecipe } = useRecipeStore();
  const { addItems } = useShoppingListStore();
  const navigate = useNavigate();

  const handleSuggest = async () => {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      setError('Bạn chưa cấu hình Gemini API Key. Vui lòng vào Cài đặt để thêm.');
      return;
    }

    if (pantryItems.length === 0) {
      setError('Tủ lạnh của bạn đang trống! Hãy thêm một vài nguyên liệu trước nhé.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const itemsStr = pantryItems.map(item => {
        let str = `- ${item.name} (${item.quantity} ${item.unit})`;
        if (item.expiry_date) {
          str += ` - HSD: ${item.expiry_date}`;
        }
        return str;
      }).join('\n');

      let cookbookStr = '';
      if (useCookbook && recipes.length > 0) {
        cookbookStr = recipes.map(r => {
          const ingList = r.ingredients.map(ing => ing.name).join(', ');
          return `- [ID: ${r.id}] ${r.title} (Nguyên liệu: ${ingList})`;
        }).join('\n');
      }

      const results = await suggestRecipesFromPantry(GEMINI_MODELS[0].name, apiKey, itemsStr, cookbookStr);
      setSuggestions(results);
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra khi gọi AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (recipe: SuggestedRecipe) => {
    if (!recipe.missing_ingredients || recipe.missing_ingredients.length === 0) return;
    
    const itemsToAdd = recipe.missing_ingredients.map(name => ({
      name,
      quantity: 1,
      unit: '',
      group: 'Khác'
    }));
    
    await addItems(itemsToAdd);
    // Optionally you can show a toast here to confirm
  };

  const handleSaveRecipe = (suggestion: SuggestedRecipe) => {
    const newRecipeId = crypto.randomUUID();
    const newRecipe: Recipe = {
      id: newRecipeId,
      title: suggestion.title,
      slug: suggestion.title.toLowerCase().replace(/ /g, '-'),
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
      prep_time: suggestion.prep_time_minutes,
      cook_time: suggestion.cook_time_minutes,
      difficulty: suggestion.difficulty as any,
      calories: 0,
      taste_score: 0,
      servings: 2,
      author_id: 'user',
      ingredients: suggestion.ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.amount,
        unit: ing.unit,
        group: 'Khác'
      })),
      steps: suggestion.steps.map(step => ({
        instruction: step.content
      }))
    };

    addRecipe(newRecipe).then(() => {
      navigate(`/recipes/${newRecipeId}`);
    });
  };

  return (
    <Card className="max-h-[calc(100vh-8rem)] bg-white border-none shadow-none flex flex-col">
      <CardBody className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-default-200">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Sparkles className="w-5 h-5" />
            <span>AI Gợi ý Món ngon</span>
          </div>
          <Button 
            size="sm" 
            color="primary" 
            variant="flat" 
            onPress={handleSuggest} 
            isLoading={isLoading}
            isIconOnly={suggestions.length > 0}
            startContent={!isLoading && suggestions.length > 0 ? <Sparkles className="w-4 h-4" /> : undefined}
          >
            {suggestions.length === 0 ? 'Gợi ý ngay' : ''}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {suggestions.length === 0 && !isLoading && !error && (
            <div className="mb-4">
              <Checkbox 
                isSelected={useCookbook} 
                onValueChange={setUseCookbook}
                size="sm"
                color="secondary"
              >
                Ưu tiên món trong Sổ tay của tôi
              </Checkbox>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              <p className="text-default-500 font-medium animate-pulse text-sm">AI đang phân tích tủ lạnh...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-danger text-center">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="flex flex-col gap-4">
              {suggestions.map((recipe, idx) => {
                const isFromCookbook = !!recipe.cookbook_recipe_id;
                return (
                <Card key={idx} className={`bg-white border shadow-sm ${isFromCookbook ? 'border-secondary-200' : 'border-default-200'}`}>
                  <CardBody className="p-3 gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-primary leading-tight">{recipe.title}</h3>
                          {isFromCookbook && (
                            <Chip size="sm" color="secondary" variant="flat" className="h-5 text-[10px]" startContent={<BookOpen className="w-3 h-3" />}>
                              Từ sổ tay
                            </Chip>
                          )}
                        </div>
                        <p className="text-xs text-default-500 mt-1 line-clamp-2">{recipe.description}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {recipe.missing_ingredients && recipe.missing_ingredients.length > 0 && (
                          <Button 
                            color="primary" 
                            size="sm" 
                            variant="light"
                            isIconOnly
                            onPress={() => handleAddToCart(recipe)}
                            title="Cho nguyên liệu còn thiếu vào giỏ đi chợ"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </Button>
                        )}
                        {isFromCookbook ? (
                          <Button 
                            color="secondary" 
                            size="sm" 
                            variant="light"
                            isIconOnly
                            onPress={() => navigate(`/recipes/${recipe.cookbook_recipe_id}`)}
                            title="Xem công thức"
                          >
                            <BookOpen className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button 
                            color="secondary" 
                            size="sm" 
                            variant="light"
                            isIconOnly
                            onPress={() => handleSaveRecipe(recipe)}
                            title="Lưu sổ tay"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Chip size="sm" variant="flat" className="h-6 text-[10px]" startContent={<ChefHat className="w-3 h-3" />}>
                        {recipe.difficulty}
                      </Chip>
                      <Chip size="sm" variant="flat" className="h-6 text-[10px]" startContent={<Clock className="w-3 h-3" />}>
                        {recipe.prep_time_minutes + recipe.cook_time_minutes}p
                      </Chip>
                    </div>

                    <div className="flex flex-col gap-2 bg-default-50 p-2 rounded-lg">
                      <div>
                        <p className="font-medium text-[11px] mb-1 text-success-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Đã có
                        </p>
                        <ul className="text-[11px] space-y-0.5">
                          {recipe.ingredients.slice(0, 3).map((ing, i) => (
                            <li key={i} className="text-default-600 truncate">
                              • {ing.name}
                            </li>
                          ))}
                          {recipe.ingredients.length > 3 && (
                            <li className="text-default-400 italic">+{recipe.ingredients.length - 3} nữa...</li>
                          )}
                        </ul>
                      </div>
                      
                      {recipe.missing_ingredients && recipe.missing_ingredients.length > 0 && (
                        <div>
                          <p className="font-medium text-[11px] mb-1 text-warning-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Cần mua
                          </p>
                          <ul className="text-[11px] space-y-0.5">
                            {recipe.missing_ingredients.map((mi, i) => (
                              <li key={i} className="text-default-600 truncate">
                                • {mi}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-default-400 py-12 px-4 text-center gap-2">
              <Sparkles className="w-12 h-12 opacity-50 mb-2" />
              <p className="font-medium text-sm">Hôm nay ăn gì?</p>
              <p className="text-xs">Nhấn "Gợi ý ngay" để AI lên thực đơn từ nguyên liệu sẵn có nhé!</p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
