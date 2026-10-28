import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, AppCard, StatCard, SectionTitle, EmptyState } from '@/ui';
import { 
  ChefHat, Calendar, BookOpen, 
  Lightbulb, Plus, 
  Flame,
  Utensils, Sunrise, Sun, Moon,
  ArrowRight
} from 'lucide-react';
import type { MealPlan } from '@apron/core';
import { 
  MealPlanRepository,
  useRecipeStore,
  useCourseStore,
  useTipStore,
} from '@apron/core';
import { ImageManager } from '../lib/image-manager';
import { RecipeCard } from '../components/recipes/list/RecipeCard';

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { recipes, fetchRecipes } = useRecipeStore();
  const { courses, fetchCourses } = useCourseStore();
  const { tips, fetchTips } = useTipStore();

  const [todayMealPlan, setTodayMealPlan] = useState<MealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const today = new Date().toISOString().split('T')[0];

        const [, , , plan] = await Promise.all([
          fetchRecipes(),
          fetchCourses(),
          fetchTips(),
          MealPlanRepository.getByDate(today),
        ]);
        setTodayMealPlan(plan);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [fetchRecipes, fetchCourses, fetchTips]);

  const dailyTip = useMemo(() => {
    if (tips.length === 0) return null;
    const dayIndex = new Date().getDate() % tips.length;
    return tips[dayIndex];
  }, [tips]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetings.morning');
    if (hour < 18) return t('dashboard.greetings.afternoon');
    return t('dashboard.greetings.evening');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const recentRecipes = recipes.slice(0, 4);
  const activeCourses = courses.slice(0, 3); // mock logic for active

  return (
    <div className="flex flex-col gap-8 w-full py-6">
      
      {/* 1. Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="app-page-title mb-1">
            {getGreeting()}, Chef! 👨‍🍳
          </h1>
          <p className="app-page-subtitle">
            {t('dashboard.subtitle')}
          </p>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <Button 
            color="primary" 
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => navigate('/recipes/new')}
          >
            Thêm công thức
          </Button>
          <Button 
            variant="flat" 
            color="primary"
            startContent={<Calendar className="w-4 h-4" />}
            onPress={() => navigate('/meal-planner')}
          >
            Lên thực đơn
          </Button>
        </div>
      </div>

      {/* 2. Overview Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          layout="vertical"
          icon={<ChefHat className="w-5 h-5 sm:w-6 sm:h-6" />}
          label={t('dashboard.stats.recipes')}
          value={recipes.length}
          color="primary"
          onClick={() => navigate('/recipes')}
        />
        
        <StatCard
          layout="vertical"
          icon={<Calendar className="w-5 h-5 sm:w-6 sm:h-6" />}
          label={t('dashboard.todayMeals')}
          value={`${todayMealPlan ? todayMealPlan.meals.length : 0} món`}
          color="secondary"
          onClick={() => navigate('/meal-planner')}
        />

        <StatCard
          layout="vertical"
          icon={<Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />}
          label={t('tips.title')}
          value={tips.length}
          color="warning"
          onClick={() => navigate('/tips')}
        />

        <StatCard
          layout="vertical"
          icon={<BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />}
          label={t('courses.title')}
          value={courses.length}
          color="success"
          onClick={() => navigate('/courses')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Recipes & Courses */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Recent Recipes */}
          <div className="flex flex-col gap-4">
            <SectionTitle
              title={t('dashboard.recentRecipes')}
              icon={<Flame className="w-5 h-5 text-danger" />}
              actionLabel={t('dashboard.viewAll')}
              onAction={() => navigate('/recipes')}
            />
            
            {recentRecipes.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {recentRecipes.map(recipe => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe} 
                    viewType="grid-portrait" 
                    onClick={() => navigate(`/recipes/${recipe.id}`)} 
                  />
                ))}
              </div>
            ) : (
              <AppCard>
                <EmptyState
                  compact
                  icon={<ChefHat className="w-6 h-6" />}
                  description={t('recipes.empty.title')}
                  actionLabel={t('recipes.empty.createFirst')}
                  onAction={() => navigate('/recipes/new')}
                />
              </AppCard>
            )}
          </div>

          {/* Active Courses */}
          <div className="flex flex-col gap-4">
            <SectionTitle
              title={t('courses.title')}
              icon={<BookOpen className="w-5 h-5 text-primary" />}
              actionLabel={t('dashboard.viewAll')}
              onAction={() => navigate('/courses')}
            />
            
            {activeCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {activeCourses.map(course => (
                  <div 
                    key={course.id} 
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="group w-full aspect-[4/3] relative overflow-hidden rounded-xl transition-all duration-300 rounded-xl bg-black border-none shadow-none hover:scale-[1.02] cursor-pointer card-media-root"
                  >
                    {/* Background Image: dừng lại trước 2 góc dưới và fade mask để triệt tiêu hoàn toàn viền trắng subpixel */}
                    {course.thumbnail_url ? (
                      <img 
                        src={ImageManager.getAssetUrl(course.thumbnail_url)} 
                        alt={course.title} 
                        className="card-media-img absolute inset-x-0 top-0 bottom-6 w-full h-[calc(100%-1.5rem)] object-cover z-0" 
                      />
                    ) : (
                      <div className="card-media-img absolute inset-x-0 top-0 bottom-6 w-full h-[calc(100%-1.5rem)] flex items-center justify-center bg-default-100 text-default-400 z-0">
                        <BookOpen className="w-12 h-12" />
                      </div>
                    )}

                    {/* Additional dark gradient for text readability */}
                    <div 
                      className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/50 via-50% to-transparent pointer-events-none"
                    />

                    {/* Content Area */}
                    <div className="relative z-10 flex flex-col justify-end h-full p-4 text-white text-left w-full">
                      <h3 className="font-bold text-base sm:text-lg line-clamp-2 leading-tight mb-3 drop-shadow-md">{course.title}</h3>
                      
                      {/* Metadata Row — Bỏ viền, bỏ nền, ngăn cách nhau bằng dấu chấm giữa dòng (•) */}
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs font-medium text-white/90 drop-shadow-sm">
                        {course.level && (
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                            <span>{course.level}</span>
                          </span>
                        )}

                        {course.modules && course.modules.length > 0 && (
                          <span className="inline-flex items-center gap-2">
                            {course.level && <span className="text-white/40 select-none">•</span>}
                            <span>{course.modules.length} {t('courses.modules', 'chương')}</span>
                          </span>
                        )}

                        {course.modules?.some((m: any) => m.lessons?.length) && (
                          <span className="inline-flex items-center gap-2">
                            {(course.level || (course.modules && course.modules.length > 0)) && (
                              <span className="text-white/40 select-none">•</span>
                            )}
                            <span>{course.modules.reduce((acc: any, m: any) => acc + (m.lessons?.length || 0), 0)} {t('courses.lessons', 'bài')}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AppCard>
                <EmptyState
                  compact
                  icon={<BookOpen className="w-6 h-6" />}
                  description={t('courses.empty.title')}
                  actionLabel={t('courses.empty.createFirst')}
                  onAction={() => navigate('/courses')}
                />
              </AppCard>
            )}
          </div>
          
        </div>

        {/* Right Column: Today's Plan & Daily Tip */}
        <div className="flex flex-col gap-6">
          
          {/* Today's Plan */}
          <div className="flex flex-col gap-4">
            <SectionTitle
              title={t('dashboard.todayMeals')}
              icon={<Utensils className="w-5 h-5 text-primary" />}
              actionLabel={todayMealPlan ? t('common.actions.edit') : t('dashboard.planAMeal')}
              onAction={() => navigate('/meal-planner')}
            />
            <AppCard className="p-4 sm:p-5 flex flex-col gap-4">
              {todayMealPlan ? (
                <>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-warning-500">
                      <Sunrise className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">{t('planner.slots.breakfast')}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-1">
                      {todayMealPlan.meals.filter(m => m.meal_type === 'breakfast').length > 0 ? (
                        todayMealPlan.meals.filter(m => m.meal_type === 'breakfast').map((m, i) => {
                          const recipe = recipes.find(r => r.id === m.recipe_id);
                          if (recipe) {
                            return <RecipeCard key={i} recipe={recipe} viewType="grid-landscape" size="sm" onClick={() => navigate(`/recipes/${recipe.id}`)} />
                          }
                          return <div key={i} className="text-sm font-medium py-1 border-l-2 border-primary pl-3 col-span-full">{m.notes || 'Món ăn'}</div>
                        })
                      ) : <span className="text-sm text-default-400 italic col-span-full">{t('dashboard.noMealsToday')}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-primary-500">
                      <Sun className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">{t('planner.slots.lunch')}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-1">
                      {todayMealPlan.meals.filter(m => m.meal_type === 'lunch').length > 0 ? (
                        todayMealPlan.meals.filter(m => m.meal_type === 'lunch').map((m, i) => {
                          const recipe = recipes.find(r => r.id === m.recipe_id);
                          if (recipe) {
                            return <RecipeCard key={i} recipe={recipe} viewType="grid-landscape" size="sm" onClick={() => navigate(`/recipes/${recipe.id}`)} />
                          }
                          return <div key={i} className="text-sm font-medium py-1 border-l-2 border-secondary pl-3 col-span-full">{m.notes || 'Món ăn'}</div>
                        })
                      ) : <span className="text-sm text-default-400 italic col-span-full">{t('dashboard.noMealsToday')}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-secondary-500">
                      <Moon className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">{t('planner.slots.dinner')}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-1">
                      {todayMealPlan.meals.filter(m => m.meal_type === 'dinner').length > 0 ? (
                        todayMealPlan.meals.filter(m => m.meal_type === 'dinner').map((m, i) => {
                          const recipe = recipes.find(r => r.id === m.recipe_id);
                          if (recipe) {
                            return <RecipeCard key={i} recipe={recipe} viewType="grid-landscape" size="sm" onClick={() => navigate(`/recipes/${recipe.id}`)} />
                          }
                          return <div key={i} className="text-sm font-medium py-1 border-l-2 border-warning pl-3 col-span-full">{m.notes || 'Món ăn'}</div>
                        })
                      ) : <span className="text-sm text-default-400 italic col-span-full">{t('dashboard.noMealsToday')}</span>}
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  compact
                  icon={<Calendar className="w-6 h-6" />}
                  description={t('dashboard.noMealsToday')}
                  actionLabel={t('dashboard.planAMeal')}
                  onAction={() => navigate('/meal-planner')}
                />
              )}
            </AppCard>
          </div>

          {/* Daily Tip */}
          {dailyTip && (
            <div className="flex flex-col gap-4">
              <SectionTitle
                title={t('tips.dailyTip')}
                icon={<Lightbulb className="w-5 h-5 text-warning" />}
                actionLabel={t('dashboard.viewAll')}
                onAction={() => navigate('/tips')}
              />
              <AppCard 
                pressable 
                onClick={() => navigate(`/tips/${dailyTip.id}`)}
                className="p-3.5 sm:p-4 flex flex-row gap-3.5 sm:gap-4 items-center hover:bg-default-100/70 active:scale-[0.99] transition-all text-left cursor-pointer border border-divider/40"
              >
                {/* Ảnh đại diện mẹo bên trái */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-warning/10 dark:bg-warning/20 flex items-center justify-center relative shadow-sm">
                  <img 
                    src={
                      dailyTip.image_url && !dailyTip.image_url.includes('1603048297172')
                        ? ImageManager.getAssetUrl(dailyTip.image_url)
                        : 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80'
                    } 
                    alt={dailyTip.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 -z-10 flex flex-col items-center justify-center bg-warning/10 dark:bg-warning/20 text-warning">
                    <Lightbulb className="w-8 h-8" />
                  </div>
                </div>

                {/* Khối nội dung bên phải */}
                <div className="flex-1 min-w-0 flex flex-col justify-center text-left items-start">
                  <h4 className="app-card-title text-foreground line-clamp-1 text-sm font-bold text-left mb-1">
                    {dailyTip.title}
                  </h4>
                  <p className="app-body-text text-default-500 text-xs leading-relaxed text-left line-clamp-3">
                    {(() => {
                      const plain = dailyTip.content.replace(/<[^>]*>?/gm, '').trim();
                      const maxLen = 140;
                      const text = plain.length > maxLen 
                        ? (plain.substring(0, maxLen).lastIndexOf(' ') > 90 
                            ? plain.substring(0, plain.substring(0, maxLen).lastIndexOf(' ')) 
                            : plain.substring(0, maxLen)).trim() + '...'
                        : plain;
                      return text;
                    })()}{' '}
                    <span className="inline-flex items-center gap-0.5 font-bold text-warning whitespace-nowrap active:opacity-70 ml-1">
                      {t('tips.readTip') || 'Đọc mẹo này'}
                      <ArrowRight className="w-3.5 h-3.5 inline shrink-0" />
                    </span>
                  </p>
                </div>
              </AppCard>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
