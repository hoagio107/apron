import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, AppCard, StatCard, SectionTitle, EmptyState } from '@/ui';
import { 
  ChefHat, Calendar, BookOpen, 
  Lightbulb, TrendingUp, Plus, 
  ArrowRight, Clock, Star, Flame,
  Utensils, Sunrise, Sun, Moon
} from 'lucide-react';
import type { Recipe, MealPlan, Tip, Course } from '@apron/core';
import { 
  RecipeRepository, MealPlanRepository, TipRepository, CourseRepository 
} from '@apron/core';
import { ImageManager } from '../lib/image-manager';
import { RecipeCard } from '../components/recipes/list/RecipeCard';

export function DashboardPage() {
  const navigate = useNavigate();

  // State
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [todayMealPlan, setTodayMealPlan] = useState<MealPlan | null>(null);
  const [dailyTip, setDailyTip] = useState<Tip | null>(null);
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
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
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
            Hôm nay bạn muốn nấu món gì? Hãy khám phá tủ lạnh hoặc lên thực đơn nhé.
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
          icon={<ChefHat className="w-6 h-6" />}
          label="Công thức của bạn"
          value={recipes.length}
          color="primary"
        />
        
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          label="Thực đơn hôm nay"
          value={`${todayMealPlan ? todayMealPlan.meals.length : 0} món`}
          color="secondary"
        />

        <StatCard
          icon={<Lightbulb className="w-6 h-6" />}
          label="Mẹo vặt nhà bếp"
          value={dailyTip ? 'Có sẵn' : 'Chưa có'}
          color="warning"
        />

        <StatCard
          icon={<BookOpen className="w-6 h-6" />}
          label="Khóa học của bạn"
          value={courses.length}
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Recipes & Courses */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Recent Recipes */}
          <div className="flex flex-col gap-4">
            <SectionTitle
              title="Công thức gần đây"
              icon={<Flame className="w-5 h-5 text-danger" />}
              actionLabel="Xem tất cả"
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
                  description="Chưa có công thức nào."
                  actionLabel="Thêm công thức đầu tiên"
                  onAction={() => navigate('/recipes/new')}
                />
              </AppCard>
            )}
          </div>

          {/* Active Courses */}
          <div className="flex flex-col gap-4">
            <SectionTitle
              title="Khóa học của bạn"
              icon={<BookOpen className="w-5 h-5 text-primary" />}
              actionLabel="Tất cả khóa học"
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
                      
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-400"></span>
                          {course.level}
                        </span>
                        
                        <span className="text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3" />
                          {course.modules?.length || 0} chương
                        </span>
                        
                        <span className="text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/10">
                          {course.modules?.reduce((acc: any, m: any) => acc + (m.lessons?.length || 0), 0) || 0} bài
                        </span>
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
                  description="Chưa có khóa học nào."
                  actionLabel="Khám phá khóa học"
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
              title="Thực đơn hôm nay"
              icon={<Utensils className="w-5 h-5 text-primary" />}
              actionLabel={todayMealPlan ? "Chỉnh sửa" : "Lên thực đơn"}
              onAction={() => navigate('/meal-planner')}
            />
            <AppCard className="p-4 sm:p-5 flex flex-col gap-4">
              {todayMealPlan ? (
                <>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-warning-500">
                      <Sunrise className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Sáng</span>
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
                      ) : <span className="text-sm text-default-400 italic col-span-full">Chưa lên món</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-primary-500">
                      <Sun className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Trưa</span>
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
                      ) : <span className="text-sm text-default-400 italic col-span-full">Chưa lên món</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-secondary-500">
                      <Moon className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Tối</span>
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
                      ) : <span className="text-sm text-default-400 italic col-span-full">Chưa lên món</span>}
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  compact
                  icon={<Calendar className="w-6 h-6" />}
                  description="Bạn chưa lên thực đơn cho hôm nay."
                  actionLabel="Lên thực đơn ngay"
                  onAction={() => navigate('/meal-planner')}
                />
              )}
            </AppCard>
          </div>

          {/* Daily Tip */}
          {dailyTip && (
            <div className="flex flex-col gap-4">
              <SectionTitle
                title="Mẹo hay cho bạn"
                icon={<Lightbulb className="w-5 h-5 text-warning" />}
                actionLabel="Tất cả mẹo hay"
                onAction={() => navigate('/tips')}
              />
              <AppCard className="p-4 sm:p-5 flex flex-col gap-3">
                <h4 className="app-card-title text-foreground line-clamp-1">{dailyTip.title}</h4>
                <p className="app-body-text text-default-600 line-clamp-3">{dailyTip.content.replace(/<[^>]*>?/gm, '')}</p>
                <div className="pt-1">
                  <Button size="sm" variant="flat" color="warning" onPress={() => navigate(`/tips/${dailyTip.id}`)}>
                    Đọc mẹo này
                  </Button>
                </div>
              </AppCard>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
