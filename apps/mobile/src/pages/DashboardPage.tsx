import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppCard, EmptyState } from '@/ui';
import { 
  ChefHat, Calendar, BookOpen, 
  Lightbulb, ArrowRight, Flame,
  Utensils
} from 'lucide-react';
import type { Recipe, MealPlan, Tip, Course } from '@apron/core';
import { 
  RecipeRepository, MealPlanRepository, TipRepository, CourseRepository 
} from '@apron/core';
import { ImageManager } from '../lib/image-manager';
import { RecipeCard } from '../components/recipes/list/RecipeCard';
import { SectionTitle } from '../components/shared/SectionTitle';
import { CourseCard } from '../components/courses/CourseCard';
import { PageLoader } from '../components/shared/PageLoader';
import { StatCard } from '../components/shared/StatCard';
import { HorizontalMealSlots } from '../components/dashboard/HorizontalMealSlots';

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [todayMealPlan, setTodayMealPlan] = useState<MealPlan | null>(null);
  const [dailyTip, setDailyTip] = useState<Tip | null>(null);
  const [tipsCount, setTipsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // 1. Fetch Recipes
        const allRecipes = await RecipeRepository.getAll();
        setRecipes(allRecipes);

        // 2. Fetch Courses
        const allCourses = await CourseRepository.getAll();
        setCourses(allCourses);

        // 3. Fetch Today's Meal Plan
        const today = new Date().toISOString().split('T')[0];
        const plan = await MealPlanRepository.getByDate(today);
        setTodayMealPlan(plan);

        // 4. Fetch Tips and pick a random one
        const allTips = await TipRepository.getAll();
        setTipsCount(allTips.length);
        if (allTips.length > 0) {
          const randomIndex = Math.floor(Math.random() * allTips.length);
          setDailyTip(allTips[randomIndex]);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetings.morning');
    if (hour < 18) return t('dashboard.greetings.afternoon');
    return t('dashboard.greetings.evening');
  };

  // Lọc duy nhất theo tên món để tránh các món trùng tên hiển thị cạnh nhau trên trang chủ
  const recentRecipes = useMemo(() => {
    const seen = new Set<string>();
    const unique: Recipe[] = [];
    for (const r of recipes) {
      if (r.parent_id) continue;
      const key = r.title.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(r);
      }
    }
    return unique.slice(0, 4);
  }, [recipes]);

  if (isLoading) {
    return <PageLoader />;
  }

  const featuredCourse = courses[0] || null;

  const handleRecipeAction = async (action: string, targetRecipe: Recipe) => {
    switch (action) {
      case 'favorite': {
        const updated = { ...targetRecipe, is_favorite: !targetRecipe.is_favorite };
        await RecipeRepository.save(updated);
        setRecipes(prev => prev.map(r => r.id === targetRecipe.id ? updated : r));
        break;
      }
      case 'edit':
        navigate(`/recipes/${targetRecipe.id}/edit`);
        break;
      case 'delete': {
        if (window.confirm(`Bạn có chắc chắn muốn xoá công thức "${targetRecipe.title}" không?`)) {
          await RecipeRepository.delete(targetRecipe.id);
          setRecipes(prev => prev.filter(r => r.id !== targetRecipe.id));
        }
        break;
      }
      case 'meal_plan':
        navigate('/meal-planner');
        break;
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full pt-6 pb-28 px-4 md:px-8">
      
      {/* 1. Welcome Banner */}
      <div className="flex items-center gap-3.5 sm:gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-content1 dark:bg-default-100 p-2 shadow-sm shrink-0 flex items-center justify-center">
          <img src="/logo.svg" alt="apron logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
          <h1 className="app-page-title mb-0.5">
            {getGreeting()}, Chef!
          </h1>
          <p className="app-page-subtitle">
            {t('dashboard.subtitle')}
          </p>
        </div>
      </div>

      {/* 2. Overview Statistics — 4 Columns Full-Width */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full">
        <StatCard
          layout="vertical"
          icon={<ChefHat className="w-4 h-4 sm:w-5 sm:h-5" />}
          label={t('nav.recipes')}
          value={recipes.length}
          color="primary"
          onClick={() => navigate('/recipes')}
        />
        <StatCard
          layout="vertical"
          icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />}
          label={t('nav.planner')}
          value={todayMealPlan ? todayMealPlan.meals.length : 0}
          color="secondary"
          onClick={() => navigate('/meal-planner')}
        />
        <StatCard
          layout="vertical"
          icon={<Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />}
          label={t('nav.tips')}
          value={tipsCount}
          color="warning"
          onClick={() => navigate('/tips')}
        />
        <StatCard
          layout="vertical"
          icon={<BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />}
          label={t('nav.courses')}
          value={courses.length}
          color="success"
          onClick={() => navigate('/courses')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Today's Meal Plan & Recent Recipes */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Today's Meal Plan — Bố cục dàn ngang 3 bữa (Sáng, Trưa, Tối) */}
          <div className="flex flex-col gap-4">
            <SectionTitle
              title={t('dashboard.todayMeals')}
              icon={<Utensils className="w-5 h-5 text-primary" />}
              actionLabel={todayMealPlan ? t('dashboard.viewAll') : undefined}
              onAction={todayMealPlan ? () => navigate('/meal-planner') : undefined}
            />
            {todayMealPlan ? (
              <HorizontalMealSlots mealPlan={todayMealPlan} recipes={recipes} />
            ) : (
              <AppCard className="p-4">
                <EmptyState
                  layout="horizontal"
                  icon={<Calendar className="w-5 h-5 text-primary" />}
                  title={t('dashboard.todayMeals')}
                  description={t('dashboard.noMealsToday')}
                  actionLabel={t('dashboard.planAMeal')}
                  actionColor="primary"
                  onAction={() => navigate('/meal-planner')}
                />
              </AppCard>
            )}
          </div>

          {/* Recent Recipes */}
          <div className="flex flex-col gap-4">
            {(() => {
              const hasRecentRecipes = recentRecipes.length > 0;
              return (
                <>
                  <SectionTitle
                    title={t('dashboard.recentRecipes')}
                    icon={<Flame className="w-5 h-5 text-danger" />}
                    actionLabel={hasRecentRecipes ? t('dashboard.viewAll') : undefined}
                    onAction={hasRecentRecipes ? () => navigate('/recipes') : undefined}
                  />
                  
                  {hasRecentRecipes ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {recentRecipes.map(recipe => (
                        <RecipeCard 
                          key={recipe.id} 
                          recipe={recipe} 
                          viewType="grid-portrait" 
                          onClick={() => navigate(`/recipes/${recipe.id}`)} 
                          onAction={handleRecipeAction}
                        />
                      ))}
                    </div>
                  ) : (
                    <AppCard className="p-4">
                      <EmptyState
                        layout="horizontal"
                        icon={<ChefHat className="w-5 h-5 text-primary" />}
                        title={t('recipes.empty.title')}
                        description={t('recipes.empty.description')}
                        actionLabel={t('recipes.addRecipe')}
                        actionColor="primary"
                        onAction={() => navigate('/recipes/new')}
                      />
                    </AppCard>
                  )}
                </>
              );
            })()}
          </div>
          
        </div>

        {/* Right Column: Featured Course (Chỉ 1 khoá học) & Daily Tip */}
        <div className="flex flex-col gap-6">
          
          {/* Featured Course — Chỉ hiển thị 1 khóa học nổi bật ở trang chủ */}
          <div className="flex flex-col gap-4">
            {(() => {
              const hasCourses = courses.length > 0;
              return (
                <>
                  <SectionTitle
                    title={t('courses.title')}
                    icon={<BookOpen className="w-5 h-5 text-primary" />}
                    actionLabel={hasCourses ? t('dashboard.viewAll') : undefined}
                    onAction={hasCourses ? () => navigate('/courses') : undefined}
                  />
                  
                  {featuredCourse ? (
                    <CourseCard 
                      course={featuredCourse} 
                      className="aspect-16/10 sm:aspect-video lg:aspect-4/3" 
                    />
                  ) : (
                    <AppCard className="p-4">
                      <EmptyState
                        layout="horizontal"
                        icon={<BookOpen className="w-5 h-5 text-primary" />}
                        title={t('courses.empty.title')}
                        description={t('courses.empty.description')}
                        actionLabel={t('courses.empty.createFirst')}
                        actionColor="primary"
                        onAction={() => navigate('/courses')}
                      />
                    </AppCard>
                  )}
                </>
              );
            })()}
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
                className="p-3.5 sm:p-4 flex flex-row gap-3.5 sm:gap-4 items-center active:scale-95 transition-transform text-left"
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
                      const maxLen = 95;
                      const text = plain.length > maxLen 
                        ? (plain.substring(0, maxLen).lastIndexOf(' ') > 60 
                            ? plain.substring(0, plain.substring(0, maxLen).lastIndexOf(' ')) 
                            : plain.substring(0, maxLen)).trim() + '...'
                        : plain;
                      return text;
                    })()}{' '}
                    <span className="inline-flex items-center gap-0.5 font-bold text-warning whitespace-nowrap active:opacity-70 ml-1">
                      Đọc mẹo này
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
