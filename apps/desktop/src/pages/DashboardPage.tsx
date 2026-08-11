import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Button, Chip, CardHeader } from '@apron/ui';
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
import { SectionTitle } from '../components/shared/SectionTitle';

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
          <h1 className="text-3xl font-bold text-foreground mb-1">
            {getGreeting()}, Chef! 👨‍🍳
          </h1>
          <p className="text-default-500">
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
        <Card className="bg-white rounded-2xl border border-default-100 shadow-none">
          <CardBody className="flex flex-row items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-default-500">Công thức của bạn</p>
              <h3 className="text-2xl font-bold text-foreground">{recipes.length}</h3>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-white rounded-2xl border border-default-100 shadow-none">
          <CardBody className="flex flex-row items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-default-500">Thực đơn hôm nay</p>
              <h3 className="text-2xl font-bold text-foreground">
                {todayMealPlan ? todayMealPlan.meals.length : 0} món
              </h3>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white rounded-2xl border border-default-100 shadow-none">
          <CardBody className="flex flex-row items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center text-warning">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-default-500">Mẹo vặt nhà bếp</p>
              <h3 className="text-2xl font-bold text-foreground">{dailyTip ? 'Có sẵn' : 'Chưa có'}</h3>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white rounded-2xl border border-default-100 shadow-none">
          <CardBody className="flex flex-row items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-success">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-default-500">Khóa học</p>
              <h3 className="text-2xl font-bold text-foreground">{courses.length}</h3>
            </div>
          </CardBody>
        </Card>
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
              <Card className="bg-white rounded-2xl border border-dashed border-default-200 shadow-none">
                <CardBody className="py-8 flex flex-col items-center justify-center text-center gap-2">
                  <ChefHat className="w-10 h-10 text-default-300" />
                  <p className="text-default-500">Chưa có công thức nào.</p>
                  <Button size="sm" color="primary" variant="flat" onPress={() => navigate('/recipes/new')} className="mt-2">
                    Thêm công thức đầu tiên
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Active Courses */}
          <div className="flex flex-col gap-4">
            <SectionTitle
              title="Khóa học nổi bật"
              icon={<BookOpen className="w-5 h-5 text-primary" />}
              actionLabel="Tất cả khóa học"
              onAction={() => navigate('/courses')}
            />
            
            {activeCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {activeCourses.map(course => (
                  <Card 
                    key={course.id} 
                    isPressable
                    onPress={() => navigate(`/courses/${course.id}`)}
                    radius="lg"
                    className="group w-full aspect-[4/3] relative overflow-hidden transition-all duration-300 shadow-lg border-none hover:scale-[1.02]"
                  >
                    {/* Background Image */}
                    {course.thumbnail_url ? (
                      <img 
                        src={ImageManager.getAssetUrl(course.thumbnail_url)} 
                        alt={course.title} 
                        className="absolute inset-0 w-full h-full object-cover z-0" 
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-white text-default-400 z-0">
                        <BookOpen className="w-12 h-12" />
                      </div>
                    )}

                    {/* Gradient Blur Overlay */}
                    <div 
                      className="absolute inset-0 z-0 bg-black/30 backdrop-blur-md"
                      style={{ 
                        borderRadius: 'inherit',
                        WebkitMaskImage: 'linear-gradient(to top, black 0%, black 30%, transparent 60%)', 
                        maskImage: 'linear-gradient(to top, black 0%, black 30%, transparent 60%)' 
                      }}
                    ></div>
                    {/* Additional dark gradient for text readability */}
                    <div 
                      className="absolute inset-0 z-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"
                      style={{ borderRadius: 'inherit' }}
                    ></div>

                    {/* Content Area */}
                    <div className="relative z-10 flex flex-col justify-end h-full p-4 text-white text-left w-full">
                      <h3 className="font-bold text-lg line-clamp-2 leading-tight mb-3 drop-shadow-md">{course.title}</h3>
                      
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
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white rounded-2xl border border-dashed border-default-200 shadow-none">
                <CardBody className="py-6 flex flex-col items-center justify-center text-center gap-2">
                  <p className="text-sm text-default-500">Chưa có khóa học nào.</p>
                </CardBody>
              </Card>
            )}
          </div>
          
        </div>

        {/* Right Column: Daily Tip & Today's Plan */}
        <div className="flex flex-col gap-6">
          
          {/* Today's Plan */}
          <Card className="bg-white rounded-2xl border border-default-100 shadow-none overflow-visible relative">
            <CardHeader className="pt-5 pb-2 px-5 flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                Thực đơn hôm nay
              </h2>
              {todayMealPlan && (
                <Button variant="light" color="primary" size="sm" endContent={<ArrowRight className="w-4 h-4" />} onPress={() => navigate('/meal-planner')}>
                  Chỉnh sửa
                </Button>
              )}
            </CardHeader>
            <CardBody className="px-5 pb-5 pt-2 flex flex-col gap-4">
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
                <div className="py-6 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-default-100 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-default-400" />
                  </div>
                  <p className="text-sm text-default-500">Bạn chưa lên thực đơn cho hôm nay.</p>
                  <Button size="sm" color="primary" onPress={() => navigate('/meal-planner')}>
                    Lên thực đơn ngay
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Daily Tip */}
          {dailyTip && (
            <Card className="bg-white rounded-2xl border border-default-100 shadow-none">
              <CardBody className="p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-warning">
                  <Lightbulb className="w-5 h-5 fill-warning" />
                  <h3 className="font-bold">Mẹo hay cho bạn</h3>
                </div>
                <h4 className="font-semibold text-foreground text-sm">{dailyTip.title}</h4>
                <p className="text-sm text-default-600 line-clamp-3">{dailyTip.content.replace(/<[^>]*>?/gm, '')}</p>
                <Button size="sm" variant="light" color="warning" className="w-fit -ml-2 mt-1" onPress={() => navigate(`/tips/${dailyTip.id}`)}>
                  Đọc thêm
                </Button>
              </CardBody>
            </Card>
          )}

        </div>
      </div>

    </div>
  );
}
