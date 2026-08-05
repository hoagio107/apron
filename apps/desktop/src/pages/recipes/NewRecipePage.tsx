import { RecipeForm } from '../../components/recipes/form';
import type { FormValues } from '../../components/recipes/form';
// Removed unused import

import { MOCK_SAVE_DELAY_MS } from '../../constants';

export function NewRecipePage() {
  // Removed unused navigate

  const handleSubmit = async (_data: FormValues) => {
    // TODO: implement local saving logic
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, MOCK_SAVE_DELAY_MS));
    
    // navigate('/recipes'); // Navigate to recipe list after saving
  };

  return (
    <div className="h-full">
      <RecipeForm onSubmit={handleSubmit} />
    </div>
  );
}
