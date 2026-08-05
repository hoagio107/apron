
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, useFieldArray, useWatch, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  Save, Plus, Trash2, ArrowLeft, Loader2, 
  SlidersHorizontal, Tags, Info,
  ShoppingBasket, ChefHat, Link as LinkIcon, X, Check,
  ChevronDown, PlusCircle, Plus as PlusIcon, GripVertical, FolderPlus,
  Search, Sparkles, Copy, ChevronUp, Scale, ImagePlus
} from 'lucide-react';
import { 
  Recipe, Ingredient, Step,
  MAIN_INGREDIENTS, COOKING_METHODS, DISH_TYPES, 
  CUISINES, OCCASIONS, DIETARY 
} from '@/lib/recipe-types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RichTextToolbar } from './RichTextToolbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { ImageUploader } from './ImageUploader';
import { useRecipes } from '@/hooks/use-recipes';
import { useUnits } from '@/hooks/use-units';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { uploadImageToDrive } from '@/lib/google-drive';

const recipeSchema = z.object({
  title: z.string().min(2, "Vui lòng nhập tên món"),
  image_url: z.string().url("Link ảnh không hợp lệ").optional().or(z.string().length(0)),
  prep_time: z.coerce.number().min(0),
  cook_time: z.coerce.number().min(0),
  servings: z.coerce.number().min(1),
  difficulty: z.enum(['Dễ', 'Vừa', 'Khó']),
  calories: z.coerce.number().min(0),
  taste_score: z.coerce.number().min(1).max(5),
  main_ingredients: z.array(z.string()).default([]),
  cooking_method: z.string().optional(),
  dish_type: z.string().optional(),
  cuisine: z.string().optional(),
  occasions: z.array(z.string()).default([]),
  dietary: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  video_url: z.string().optional(),
  parent_id: z.string().nullable().optional(),
  related_recipes: z.array(z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    image_url: z.string().optional()
  })).optional().default([]),
  ingredientSections: z.array(z.object({
    name: z.string().min(1, "Tên nhóm"),
    ingredients: z.array(z.object({
      id: z.string(), 
      name: z.string().min(1, "Nhập tên"),
      quantity: z.preprocess((val) => (val === '' ? 0 : val), z.union([z.string(), z.number()])),
      unit: z.string().optional().or(z.string().length(0))
    }))
  })),
  stepSections: z.array(z.object({
    name: z.string().min(1, "Tên giai đoạn"),
    steps: z.array(z.object({
      id: z.string(),
      instruction: z.string().min(1, "Nhập nội dung"),
      images: z.array(z.string()).default([])
    }))
  }))
});

type FormValues = z.infer<typeof recipeSchema>;

function ClassificationSection({ 
  form, 
  tagInput, 
  setTagInput, 
  isClassificationExpanded, 
  setIsClassificationExpanded,
  addTag,
  removeTag,
  toggleMultiSelect,
  isSelected,
  openQuickAdd,
  inputClass
}: {
  form: UseFormReturn<FormValues>,
  tagInput: string,
  setTagInput: (val: string) => void,
  isClassificationExpanded: boolean,
  setIsClassificationExpanded: (val: boolean) => void,
  addTag: () => void,
  removeTag: (tag: string) => void,
  toggleMultiSelect: (field: 'main_ingredients' | 'occasions' | 'dietary', id: string) => void,
  isSelected: (field: 'main_ingredients' | 'occasions' | 'dietary', id: string) => boolean,
  openQuickAdd: (category: string) => void,
  inputClass: string
}) {
  return (
    <Card className="rounded-2xl md:rounded-3xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-6 space-y-8 shadow-none md:shadow-sm">
      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white font-headline">
          <Info className="w-5 h-5 text-orange-500" /> Thông tin chính
        </h3>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tên món ăn *</FormLabel>
              <FormControl>
                <Input placeholder="Nhập tên món ăn..." {...field} className="text-lg md:text-2xl font-bold border-0 border-b-2 border-gray-100 dark:border-gray-700 rounded-none px-0 h-auto py-2 focus-visible:ring-0 focus-visible:border-orange-500 placeholder:text-gray-200 shadow-none bg-transparent" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <FormLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tags (Từ khóa)</FormLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.watch('tags')?.map(tag => (
              <Badge key={tag} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 border-none px-3 py-1.5 rounded-full font-bold shadow-none">
                #{tag} <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => removeTag(tag)} />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input 
              placeholder="Nhập tag mới..." 
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className={cn(inputClass, "h-11")}
            />
            <Button type="button" onClick={addTag} variant="secondary" className="rounded-xl px-4 h-11 shadow-none"><Plus className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      <div className="pt-10 border-t space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white font-headline">
            <Tags className="w-5 h-5 text-orange-500" /> Phân loại
          </h3>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsClassificationExpanded(!isClassificationExpanded)}
            className="text-xs font-bold text-gray-400 hover:text-orange-600 shadow-none"
          >
            {isClassificationExpanded ? (
              <span className="flex items-center gap-1">Thu gọn <ChevronUp className="w-3 h-3" /></span>
            ) : (
              <span className="flex items-center gap-1">Mở rộng <ChevronDown className="w-3 h-3" /></span>
            )}
          </Button>
        </div>
        
        {isClassificationExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel className="text-[10px] font-bold text-gray-400 uppercase">Nguyên liệu chính</FormLabel>
                <Button variant="ghost" size="icon" type="button" onClick={() => openQuickAdd('Nguyên liệu')} className="h-5 h-5 rounded-full text-orange-500"><PlusCircle className="w-3.5 h-3.5" /></Button>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn(inputClass, "w-full h-11 justify-between px-3 font-normal text-gray-500 text-left")}>
                    <span className="truncate">{form.watch('main_ingredients')?.length ? `${form.watch('main_ingredients').length} đã chọn` : '-- Chọn --'}</span>
                    <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 rounded-2xl shadow-xl">
                  <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar">
                    {MAIN_INGREDIENTS.map(group => (
                      <div key={group.group} className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-300 uppercase px-2 py-1">{group.group}</p>
                        {group.items.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleMultiSelect('main_ingredients', item.id)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between",
                              isSelected('main_ingredients', item.id) ? "bg-orange-50 text-orange-600 font-bold" : "hover:bg-gray-50"
                            )}
                          >
                            {item.name}
                            {isSelected('main_ingredients', item.id) && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <FormField control={form.control} name="cooking_method" render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-[10px] font-bold text-gray-400 uppercase">Cách chế biến</FormLabel>
                  <Button variant="ghost" size="icon" type="button" onClick={() => openQuickAdd('Cách chế biến')} className="h-5 h-5 rounded-full text-orange-500"><PlusCircle className="w-3.5 h-3.5" /></Button>
                </div>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={cn(inputClass, "h-11")}>
                      <SelectValue placeholder="-- Chọn --" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl shadow-xl">
                    {COOKING_METHODS.map(group => (
                      <SelectGroup key={group.group}>
                        <SelectLabel className="text-[10px] uppercase text-gray-300">{group.group}</SelectLabel>
                        {group.items.map(item => (
                          <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />

            <FormField control={form.control} name="dish_type" render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-[10px] font-bold text-gray-400 uppercase">Loại món</FormLabel>
                  <Button variant="ghost" size="icon" type="button" onClick={() => openQuickAdd('Loại món')} className="h-5 h-5 rounded-full text-orange-500"><PlusCircle className="w-3.5 h-3.5" /></Button>
                </div>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={cn(inputClass, "h-11")}>
                      <SelectValue placeholder="-- Chọn --" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl shadow-xl">
                    {DISH_TYPES.map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />

            <FormField control={form.control} name="cuisine" render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-[10px] font-bold text-gray-400 uppercase">Ẩm thực</FormLabel>
                  <Button variant="ghost" size="icon" type="button" onClick={() => openQuickAdd('Ẩm thực')} className="h-5 h-5 rounded-full text-orange-500"><PlusCircle className="w-3.5 h-3.5" /></Button>
                </div>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={cn(inputClass, "h-11")}>
                      <SelectValue placeholder="-- Chọn --" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl shadow-xl">
                    {CUISINES.map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel className="text-[10px] font-bold text-gray-400 uppercase">Dịp lễ / Bữa ăn</FormLabel>
                <Button variant="ghost" size="icon" type="button" onClick={() => openQuickAdd('Dịp lễ')} className="h-5 h-5 rounded-full text-orange-500"><PlusCircle className="w-3.5 h-3.5" /></Button>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn(inputClass, "w-full h-11 justify-between px-3 font-normal text-gray-500 text-left")}>
                    <span className="truncate">{form.watch('occasions')?.length ? `${form.watch('occasions').length} đã chọn` : '-- Chọn --'}</span>
                    <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 rounded-2xl shadow-xl">
                  <div className="space-y-1">
                    {OCCASIONS.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleMultiSelect('occasions', item.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between",
                          isSelected('occasions', item.id) ? "bg-purple-50 text-purple-600 font-bold" : "hover:bg-gray-50"
                        )}
                      >
                        {item.name}
                        {isSelected('occasions', item.id) && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel className="text-[10px] font-bold text-gray-400 uppercase">Chế độ ăn</FormLabel>
                <Button variant="ghost" size="icon" type="button" onClick={() => openQuickAdd('Chế độ')} className="h-5 h-5 rounded-full text-orange-500"><PlusCircle className="w-3.5 h-3.5" /></Button>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn(inputClass, "w-full h-11 justify-between px-3 font-normal text-gray-500 text-left")}>
                    <span className="truncate">{form.watch('dietary')?.length ? `${form.watch('dietary').length} đã chọn` : '-- Chọn --'}</span>
                    <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 rounded-2xl shadow-xl">
                  <div className="space-y-1">
                    {DIETARY.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleMultiSelect('dietary', item.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between",
                          isSelected('dietary', item.id) ? "bg-green-50 text-green-600 font-bold" : "hover:bg-gray-50"
                        )}
                      >
                        {item.name}
                        {isSelected('dietary', item.id) && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function ExtraInfoSection({
  form,
  recipeSearch,
  setRecipeSearch,
  isRecipeSearchOpen,
  setIsRecipeSearchOpen,
  linkedRecipes,
  filteredRecipes,
  selectLinkedRecipe,
  removeLinkedRecipe,
  handleQuickCreateLinked,
  isQuickCreatingLinked,
  inputClass
}: {
  form: UseFormReturn<FormValues>,
  recipeSearch: string,
  setRecipeSearch: (val: string) => void,
  isRecipeSearchOpen: boolean,
  setIsRecipeSearchOpen: (val: boolean) => void,
  linkedRecipes: any[],
  filteredRecipes: any[],
  selectLinkedRecipe: (r: any) => void,
  removeLinkedRecipe: (id: string) => void,
  handleQuickCreateLinked: () => void,
  isQuickCreatingLinked: boolean,
  inputClass: string
}) {
  return (
    <Card className="rounded-2xl md:rounded-[2.5rem] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-10 space-y-6 shadow-none md:shadow-sm">
      <h3 className="text-xl font-bold flex items-center gap-3 text-gray-800 dark:text-white font-headline">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400"><LinkIcon className="w-5 h-5" /></div>
        Ghi chú & Video
      </h3>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <FormLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Liên kết tới công thức khác</FormLabel>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <Input 
              placeholder="Tìm công thức để liên kết..." 
              value={recipeSearch}
              onChange={(e) => { setRecipeSearch(e.target.value); setIsRecipeSearchOpen(true); }}
              onFocus={() => setIsRecipeSearchOpen(true)}
              className={cn(inputClass, "pl-10")}
            />
            {isRecipeSearchOpen && recipeSearch.trim() && (
              <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-2 space-y-1 max-h-64 overflow-y-auto no-scrollbar">
                  {filteredRecipes.map(r => (
                    <button key={r.id} type="button" onClick={() => selectLinkedRecipe(r)} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-left">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        <img src={r.image_url || "https://picsum.photos/50"} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{r.title}</p>
                      </div>
                      <Plus className="w-4 h-4 text-orange-500" />
                    </button>
                  ))}
                  <div className="p-2 border-t mt-2">
                    <Button type="button" variant="ghost" onClick={handleQuickCreateLinked} disabled={isQuickCreatingLinked} className="w-full justify-start text-orange-600 font-bold hover:bg-orange-50 rounded-xl gap-2">
                      {isQuickCreatingLinked ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Tạo nhanh & Liên kết "{recipeSearch}"
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {linkedRecipes.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {linkedRecipes.map(r => (
                <div key={r.id} className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 group transition-all">
                  <div className="w-6 h-6 rounded-lg bg-white overflow-hidden">
                    <img src={r.image_url || "https://picsum.photos/50"} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-orange-700 dark:text-orange-400">{r.title}</span>
                  <button type="button" onClick={() => removeLinkedRecipe(r.id)} className="p-1 hover:bg-white dark:hover:bg-gray-800 rounded-full text-orange-300 hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <FormField control={form.control} name="video_url" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold text-gray-400 uppercase">Link Video (Youtube/Tiktok)</FormLabel>
              <FormControl><Input {...field} className={inputClass} placeholder="https://..." /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold text-gray-400 uppercase">Ghi chú thêm</FormLabel>
              <RichTextToolbar targetId="recipe-notes" />
              <FormControl>
                <Textarea 
                  id="recipe-notes" 
                  {...field} 
                  className="bg-gray-100 dark:bg-gray-900 border-none rounded-b-2xl rounded-t-none p-4 shadow-none md:bg-gray-50/50 md:border md:border-input md:bg-gray-50/50 text-lg leading-relaxed resize-y min-h-[100px]" 
                  rows={4} 
                  placeholder="Những lưu ý quan trọng khi nấu..." 
                />
              </FormControl>
            </FormItem>
          )} />
        </div>
      </div>
    </Card>
  );
}

function DesktopNavbar({ 
  onCancel, 
  initialData, 
  currentTitle, 
  isSaving, 
  form, 
  setIsVariantModalOpen, 
  setNewVariantName,
  handleSave,
  onInvalid
}: { 
  onCancel: () => void, 
  initialData?: Recipe, 
  currentTitle: string, 
  isSaving: boolean, 
  form: UseFormReturn<FormValues>, 
  setIsVariantModalOpen: (val: boolean) => void, 
  setNewVariantName: (val: string) => void,
  handleSave: (data: FormValues) => void,
  onInvalid: (errors: any) => void
}) {
  return (
    <div className="fixed top-0 left-64 right-0 z-30 px-8 py-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-none h-16 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel} type="button" className="rounded-full shadow-none text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold truncate max-w-md font-headline">
          {initialData ? (currentTitle || 'Chỉnh sửa món ăn') : 'Thêm món mới'}
        </h1>
      </div>
      
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl h-10 px-5 font-bold shadow-none text-gray-500 border-gray-200 bg-white">
          <X className="w-4 h-4 mr-2" /> Hủy
        </Button>
        {(initialData || form.getValues('parent_id')) && (
          <Button 
            type="button" 
            onClick={() => { setNewVariantName(`${form.getValues('title')} (Biến thể)`); setIsVariantModalOpen(true); }} 
            className="rounded-xl h-10 px-5 font-bold shadow-none bg-purple-600 hover:bg-purple-700 text-white gap-2 border-none"
          >
            <Copy className="w-4 h-4" /> Tạo biến thể
          </Button>
        )}
        <Button onClick={form.handleSubmit(handleSave, onInvalid)} disabled={isSaving} className="bg-orange-600 hover:bg-orange-700 rounded-xl h-10 px-5 font-bold shadow-none text-white border-none">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Lưu công thức
        </Button>
      </div>
    </div>
  );
}

function MobileNavbar({ 
  onCancel, 
  initialData, 
  currentTitle, 
  isSaving, 
  form, 
  setIsVariantModalOpen, 
  setNewVariantName,
  handleSave,
  onInvalid
}: { 
  onCancel: () => void, 
  initialData?: Recipe, 
  currentTitle: string, 
  isSaving: boolean, 
  form: UseFormReturn<FormValues>, 
  setIsVariantModalOpen: (val: boolean) => void, 
  setNewVariantName: (val: string) => void,
  handleSave: (data: FormValues) => void,
  onInvalid: (errors: any) => void
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 px-4 py-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-none h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onCancel} type="button" className="rounded-full shadow-none text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <span className="text-sm font-bold truncate max-w-[120px] font-headline">
          {initialData ? (currentTitle || 'Sửa món') : 'Thêm mới'}
        </span>
      </div>
      <div className="flex gap-1">
        {(initialData || form.getValues('parent_id')) && (
          <Button variant="ghost" size="icon" type="button" onClick={() => { setNewVariantName(`${form.getValues('title')} (Biến thể)`); setIsVariantModalOpen(true); }} className="text-purple-600">
            <Copy className="w-5 h-5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={form.handleSubmit(handleSave, onInvalid)} disabled={isSaving} className="text-orange-600">
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}

export function RecipeForm({ initialData, onSave, onCancel }: { initialData?: Recipe, onSave: (data: any) => void, onCancel: () => void }) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const router = useRouter();
  const { recipes: allAvailableRecipes, addRecipe: quickAddRecipeToDb } = useRecipes();
  const { units, addUnit } = useUnits();
  
  const [tagInput, setTagInput] = useState('');
  const [ingDragState, setIngDragState] = useState<{ sIdx: number, iIdx: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddCategory, setQuickAddCategory] = useState<string>('');
  const [newAttributeName, setNewAttributeName] = useState('');

  const [isUnitQuickAddOpen, setIsUnitQuickAddOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [isAddingUnit, setIsAddingUnit] = useState(false);

  const [recipeSearch, setRecipeSearch] = useState('');
  const [isRecipeSearchOpen, setIsRecipeSearchOpen] = useState(false);
  const [isQuickCreatingLinked, setIsQuickCreatingLinked] = useState(false);

  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [newVariantName, setNewVariantName] = useState('');

  const [isClassificationExpanded, setIsClassificationExpanded] = useState(true);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const groupIngredients = (ings: Ingredient[]): FormValues['ingredientSections'] => {
    if (!ings || ings.length === 0) return [{ name: 'Nguyên liệu chính', ingredients: [{ id: generateId(), name: '', quantity: 1, unit: 'g' }] }];
    const map = new Map<string, Ingredient[]>();
    ings.forEach(ing => {
      const groupName = ing.group || 'Nguyên liệu chính';
      if (!map.has(groupName)) map.set(groupName, []);
      map.get(groupName)!.push(ing);
    });
    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      ingredients: items.map(i => ({ id: generateId(), name: i.name, quantity: i.quantity, unit: i.unit || '' }))
    }));
  };

  const groupSteps = (steps: Step[]): FormValues['stepSections'] => {
    if (!steps || steps.length === 0) return [{ name: 'Thực hiện', steps: [{ id: generateId(), instruction: '', images: [] }] }];
    const map = new Map<string, Step[]>();
    steps.forEach(step => {
      const groupName = step.group || 'Thực hiện';
      if (!map.has(groupName)) map.set(groupName, []);
      map.get(groupName)!.push(step);
    });
    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      steps: items.map(s => ({ 
        id: generateId(), 
        instruction: s.instruction,
        images: s.images || (s.image_url ? [s.image_url] : [])
      }))
    }));
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: initialData ? {
      ...initialData,
      ingredientSections: groupIngredients(initialData.ingredients),
      stepSections: groupSteps(initialData.steps),
      related_recipes: initialData.related_recipes || []
    } : {
      title: '',
      prep_time: 15,
      cook_time: 30,
      servings: 2,
      difficulty: 'Vừa',
      calories: 0,
      taste_score: 4.5,
      main_ingredients: [],
      occasions: [],
      dietary: [],
      tags: [],
      parent_id: null,
      related_recipes: [],
      ingredientSections: [{ name: 'Nguyên liệu chính', ingredients: [{ id: generateId(), name: '', quantity: 1, unit: 'g' }] }],
      stepSections: [{ name: 'Thực hiện', steps: [{ id: generateId(), instruction: '', images: [] }] }]
    }
  });

  useEffect(() => {
    if (!initialData && typeof window !== 'undefined') {
      const storedData = sessionStorage.getItem('recipe_variant_data');
      if (storedData) {
        try {
          const variant = JSON.parse(storedData);
          form.reset({
            ...form.getValues(),
            ...variant,
            title: variant.title,
            parent_id: variant.parent_id,
            ingredientSections: [{ name: 'Nguyên liệu chính', ingredients: [{ id: generateId(), name: '', quantity: 1, unit: 'g' }] }],
            stepSections: [{ name: 'Thực hiện', steps: [{ id: generateId(), instruction: '', images: [] }] }]
          });
          toast({ title: "Chế độ Biến thể", description: "Đã tải thông tin phân loại từ món gốc. Vui lòng nhập chi tiết món mới." });
          sessionStorage.removeItem('recipe_variant_data');
        } catch (e) {
          console.error("Error parsing variant data", e);
        }
      }
    }
  }, [initialData, form, toast]);

  const { fields: ingSectionFields, append: addIngSection, remove: removeIngSection } = useFieldArray({
    control: form.control,
    name: "ingredientSections"
  });

  const { fields: stepSectionFields, append: addStepSection, remove: removeStepSection } = useFieldArray({
    control: form.control,
    name: "stepSections"
  });

  const linkedRecipes = useWatch({ control: form.control, name: 'related_recipes' }) || [];
  const currentTitle = useWatch({ control: form.control, name: 'title' });
  
  const filteredRecipes = useMemo(() => {
    const term = recipeSearch.toLowerCase().trim();
    if (!term) return [];
    const selectedIds = linkedRecipes.map(r => r.id);
    return allAvailableRecipes.filter(r => 
      r.title.toLowerCase().includes(term) && 
      !selectedIds.includes(r.id) &&
      r.id !== initialData?.id
    ).slice(0, 20);
  }, [allAvailableRecipes, recipeSearch, linkedRecipes, initialData]);

  const selectLinkedRecipe = (recipe: Recipe) => {
    form.setValue('related_recipes', [...linkedRecipes, {
      id: recipe.id,
      title: recipe.title,
      slug: recipe.slug,
      image_url: recipe.image_url
    }]);
    setRecipeSearch('');
    setIsRecipeSearchOpen(false);
  };

  const handleQuickCreateVariant = () => {
    if (!newVariantName.trim()) return;
    const currentValues = form.getValues();
    const variantData = {
      title: newVariantName.trim(),
      parent_id: initialData?.parent_id || initialData?.id,
      image_url: currentValues.image_url,
      main_ingredients: currentValues.main_ingredients,
      cooking_method: currentValues.cooking_method,
      dish_type: currentValues.dish_type,
      cuisine: currentValues.cuisine,
      occasions: currentValues.occasions,
      dietary: currentValues.dietary,
      tags: currentValues.tags,
      prep_time: currentValues.prep_time,
      cook_time: currentValues.cook_time,
      servings: currentValues.servings,
      difficulty: currentValues.difficulty,
      calories: currentValues.calories,
      taste_score: currentValues.taste_score
    };
    sessionStorage.setItem('recipe_variant_data', JSON.stringify(variantData));
    setIsVariantModalOpen(false);
    router.push('/recipes/new');
  };

  const removeLinkedRecipe = (id: string) => {
    form.setValue('related_recipes', linkedRecipes.filter(r => r.id !== id));
  };

  const handleSave = async (values: FormValues) => {
    setIsSaving(true);
    const flattenedIngredients: Ingredient[] = values.ingredientSections.flatMap(section => 
      section.ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit || '',
        group: section.name
      }))
    );
    const flattenedSteps: Step[] = values.stepSections.flatMap(section => 
      section.steps.map(step => ({
        instruction: step.instruction,
        images: step.images,
        group: section.name
      }))
    );
    const { ingredientSections, stepSections, ...coreValues } = values;
    const finalData = {
      ...coreValues,
      ingredients: flattenedIngredients,
      steps: flattenedSteps,
    };
    try {
      await onSave(finalData);
    } catch (error) {
      setIsSaving(false);
    }
  };

  const onInvalid = (errors: any) => {
    const errorMessages: string[] = [];
    if (errors.title) errorMessages.push("Tên món ăn");
    if (errors.ingredientSections) errorMessages.push("Nguyên liệu");
    if (errors.stepSections) errorMessages.push("Các bước thực hiện");
    
    toast({
      variant: "destructive",
      title: "Thông tin chưa hợp lệ",
      description: errorMessages.length > 0 
        ? `Vui lòng kiểm tra lại: ${errorMessages.join(", ")}` 
        : "Vui lòng điền đầy đủ các trường thông tin bắt buộc.",
    });
  };

  const addTag = () => {
    const val = tagInput.trim();
    if (!val) return;
    const currentTags = form.getValues('tags') || [];
    if (!currentTags.includes(val)) {
      form.setValue('tags', [...currentTags, val]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(t => t !== tag));
  };

  const toggleMultiSelect = (field: 'main_ingredients' | 'occasions' | 'dietary', id: string) => {
    const current = form.getValues(field) || [];
    if (current.includes(id)) {
      form.setValue(field, current.filter(item => item !== id));
    } else {
      form.setValue(field, [...current, id]);
    }
  };

  const isSelected = (field: 'main_ingredients' | 'occasions' | 'dietary', id: string) => {
    return (form.watch(field) || []).includes(id);
  };

  const openQuickAdd = (category: string) => {
    setQuickAddCategory(category);
    setNewAttributeName('');
    setIsQuickAddOpen(true);
  };

  const handleQuickAdd = () => {
    if (!newAttributeName.trim()) return;
    toast({ title: "Đã thêm", description: `Đã thêm "${newAttributeName}" vào danh mục.` });
    setIsQuickAddOpen(false);
  };

  const handleUnitQuickAdd = async () => {
    if (!newUnitName.trim()) return;
    setIsAddingUnit(true);
    try {
      await addUnit(newUnitName.trim());
      toast({ title: "Đã thêm đơn vị", description: `Đơn vị "${newUnitName}" hiện đã sẵn sàng để chọn.` });
      setIsUnitQuickAddOpen(false);
      setNewUnitName('');
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi thêm đơn vị" });
    } finally {
      setIsAddingUnit(false);
    }
  };

  const handleIngDragStart = (sIdx: number, iIdx: number) => {
    setIngDragState({ sIdx, iIdx });
  };

  const handleIngDrop = (targetSIdx: number, targetIIdx: number) => {
    if (!ingDragState) return;
    const { sIdx: fromS, iIdx: fromI } = ingDragState;
    const sections = [...form.getValues('ingredientSections')];
    const item = sections[fromS].ingredients[fromI];
    sections[fromS].ingredients.splice(fromI, 1);
    sections[targetSIdx].ingredients.splice(targetIIdx, 0, item);
    form.setValue('ingredientSections', sections, { shouldDirty: true });
    setIngDragState(null);
  };

  const handleQuickCreateLinked = async () => {
    if (!recipeSearch.trim()) return;
    setIsQuickCreatingLinked(true);
    try {
      const name = recipeSearch.trim();
      const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
      const newId = await quickAddRecipeToDb({
        title: name,
        slug,
        image_url: '',
        prep_time: 0,
        cook_time: 0,
        servings: 1,
        difficulty: 'Vừa',
        calories: 0,
        taste_score: 4.5,
        ingredients: [],
        steps: []
      });
      if (newId) {
        form.setValue('related_recipes', [...linkedRecipes, { id: newId as string, title: name, slug }]);
        setRecipeSearch('');
        setIsRecipeSearchOpen(false);
        toast({ title: "Đã tạo món liên kết" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi tạo nhanh" });
    } finally {
      setIsQuickCreatingLinked(false);
    }
  };

  const inputClass = "h-12 font-bold rounded-xl shadow-none bg-gray-50/50 dark:bg-gray-900 border-none md:border md:border-input md:bg-gray-50/50";
  const ingredientInputClass = "h-12 font-bold rounded-xl shadow-none bg-gray-100 dark:bg-gray-900 border-none md:border md:border-input md:bg-white";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave, onInvalid)} className="min-h-screen bg-white md:bg-gray-50 dark:bg-gray-900">
        {isMobile ? (
          <MobileNavbar 
            onCancel={onCancel} 
            initialData={initialData} 
            currentTitle={currentTitle} 
            isSaving={isSaving} 
            form={form}
            setIsVariantModalOpen={setIsVariantModalOpen}
            setNewVariantName={setNewVariantName}
            handleSave={handleSave}
            onInvalid={onInvalid}
          />
        ) : (
          <DesktopNavbar 
            onCancel={onCancel} 
            initialData={initialData} 
            currentTitle={currentTitle} 
            isSaving={isSaving} 
            form={form}
            setIsVariantModalOpen={setIsVariantModalOpen}
            setNewVariantName={setNewVariantName}
            handleSave={handleSave}
            onInvalid={onInvalid}
          />
        )}
        
        <div className="pt-14 md:pt-16 pb-32 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-8 items-start", !isMobile && "mt-4")}>
              <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
                <FormField control={form.control} name="image_url" render={({ field }) => (
                  <ImageUploader value={field.value} onChange={field.onChange} label="Ảnh" />
                )} />
                <ClassificationSection 
                  form={form}
                  tagInput={tagInput}
                  setTagInput={setTagInput}
                  isClassificationExpanded={isClassificationExpanded}
                  setIsClassificationExpanded={setIsClassificationExpanded}
                  addTag={addTag}
                  removeTag={removeTag}
                  toggleMultiSelect={toggleMultiSelect}
                  isSelected={isSelected}
                  openQuickAdd={openQuickAdd}
                  inputClass={inputClass}
                />
                <RecipeMetricsComponent form={form} inputClass={inputClass} isMobile={isMobile} />
              </div>

              <div className="lg:col-span-8 space-y-6">
                <IngredientsEditorSection 
                  form={form} 
                  ingSectionFields={ingSectionFields} 
                  addIngSection={addIngSection} 
                  removeIngSection={removeIngSection} 
                  generateId={generateId}
                  units={units}
                  onAddUnit={() => setIsUnitQuickAddOpen(true)}
                  dragHandlers={{ onDragStart: handleIngDragStart, onDrop: handleIngDrop, dragState: ingDragState }}
                  ingredientInputClass={ingredientInputClass}
                />
                <StepsEditorSection 
                  form={form} 
                  stepSectionFields={stepSectionFields} 
                  addStepSection={addStepSection} 
                  removeStepSection={removeStepSection} 
                  generateId={generateId} 
                />
                <ExtraInfoSection 
                  form={form}
                  recipeSearch={recipeSearch}
                  setRecipeSearch={setRecipeSearch}
                  isRecipeSearchOpen={isRecipeSearchOpen}
                  setIsRecipeSearchOpen={setIsRecipeSearchOpen}
                  linkedRecipes={linkedRecipes}
                  filteredRecipes={filteredRecipes}
                  selectLinkedRecipe={selectLinkedRecipe}
                  removeLinkedRecipe={removeLinkedRecipe}
                  handleQuickCreateLinked={handleQuickCreateLinked}
                  isQuickCreatingLinked={isQuickCreatingLinked}
                  inputClass={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        <Dialog open={isVariantModalOpen} onOpenChange={setIsVariantModalOpen}>
          <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold font-headline">Tạo biến thể mới</DialogTitle>
              <DialogDescription className="pt-2 text-gray-500">Nhập tên cho phiên bản mới. Thông tin phân loại sẽ được giữ lại.</DialogDescription>
            </DialogHeader>
            <div className="py-6"><Input placeholder="VD: Bản ít ngọt, Cho bé..." value={newVariantName} onChange={(e) => setNewVariantName(e.target.value)} className="h-14 rounded-2xl bg-gray-50 border-none shadow-none font-bold text-lg" autoFocus /></div>
            <DialogFooter className="gap-3">
              <Button variant="ghost" onClick={() => setIsVariantModalOpen(false)} className="rounded-2xl font-bold h-12 flex-1">Hủy</Button>
              <Button onClick={handleQuickCreateVariant} disabled={!newVariantName.trim()} className="bg-purple-600 hover:bg-purple-700 rounded-2xl font-bold h-12 flex-1 text-white border-none">Tiếp tục</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
          <DialogContent className="max-w-sm rounded-3xl p-6 border-none shadow-2xl">
            <DialogHeader><DialogTitle>Thêm {quickAddCategory} mới</DialogTitle></DialogHeader>
            <div className="py-4"><Input placeholder={`Tên ${quickAddCategory.toLowerCase()}...`} value={newAttributeName} onChange={(e) => setNewAttributeName(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-none shadow-none" autoFocus /></div>
            <DialogFooter><Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="rounded-xl font-bold">Hủy</Button><Button onClick={handleQuickAdd} disabled={!newAttributeName.trim()} className="bg-orange-600 hover:bg-orange-700 rounded-xl font-bold px-8 border-none text-white shadow-none">Lưu lại</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isUnitQuickAddOpen} onOpenChange={setIsUnitQuickAddOpen}>
          <DialogContent className="max-w-sm rounded-3xl p-6 border-none shadow-2xl">
            <DialogHeader><DialogTitle className="flex items-center gap-2 font-bold"><Scale className="w-5 h-5 text-blue-500" /> Thêm đơn vị mới</DialogTitle></DialogHeader>
            <div className="py-4"><Input placeholder="VD: cái, quả, lon..." value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-none shadow-none font-bold" autoFocus /></div>
            <DialogFooter><Button variant="ghost" onClick={() => setIsUnitQuickAddOpen(false)} className="rounded-xl font-bold">Hủy</Button><Button onClick={handleUnitQuickAdd} disabled={!newUnitName.trim() || isAddingUnit} className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold px-8 border-none text-white shadow-none">{isAddingUnit ? <Loader2 className="animate-spin" /> : 'Thêm ngay'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </Form>
  );
}

function RecipeMetricsComponent({ form, inputClass, isMobile }: any) {
  return (
    <Card className={cn("border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-6 shadow-none md:shadow-sm space-y-6 rounded-2xl md:rounded-3xl")}>
      <h2 className="font-bold text-lg flex items-center gap-2 border-b pb-3 text-gray-800 dark:text-white font-headline">
        <SlidersHorizontal className="w-5 h-5 text-blue-500" /> Thông số
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="prep_time" render={({ field }) => (
          <FormItem><FormLabel className="text-[10px] font-bold text-gray-400 uppercase">Chuẩn bị (phút)</FormLabel><FormControl><Input type="number" {...field} className={inputClass} /></FormControl></FormItem>
        )} />
        <FormField control={form.control} name="cook_time" render={({ field }) => (
          <FormItem><FormLabel className="text-[10px] font-bold text-gray-400 uppercase">Nấu (phút)</FormLabel><FormControl><Input type="number" {...field} className={inputClass} /></FormControl></FormItem>
        )} />
        <FormField control={form.control} name="servings" render={({ field }) => (
          <FormItem><FormLabel className="text-[10px] font-bold text-gray-400 uppercase">Khẩu phần</FormLabel><FormControl><Input type="number" {...field} className={inputClass} /></FormControl></FormItem>
        )} />
        <FormField control={form.control} name="calories" render={({ field }) => (
          <FormItem><FormLabel className="text-[10px] font-bold text-gray-400 uppercase">Kcal</FormLabel><FormControl><Input type="number" {...field} className={inputClass} /></FormControl></FormItem>
        )} />
      </div>
      <div className="space-y-4">
        <FormField control={form.control} name="difficulty" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-bold text-gray-400 uppercase">Độ khó</FormLabel>
            <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-xl gap-1">
              {['Dễ', 'Vừa', 'Khó'].map((lvl) => (
                <Button key={lvl} type="button" variant="ghost" onClick={() => field.onChange(lvl)}
                  className={cn("flex-1 rounded-lg font-bold text-sm h-10 transition-all shadow-sm", field.value === lvl ? "bg-white dark:bg-gray-800 text-orange-600 shadow-sm" : "text-gray-400")}
                >{lvl}</Button>
              ))}
            </div>
          </FormItem>
        )} />
        <FormField control={form.control} name="taste_score" render={({ field }) => (
          <FormItem>
            <div className="flex justify-between"><FormLabel className="text-[10px] font-bold text-gray-400 uppercase">Độ ngon</FormLabel><span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 rounded-md">{field.value}/5</span></div>
            <FormControl><input type="range" min="1" max="5" step="0.1" value={field.value} onChange={(e) => field.onChange(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500" /></FormControl>
          </FormItem>
        )} />
      </div>
    </Card>
  );
}

function IngredientsEditorSection({ form, ingSectionFields, addIngSection, removeIngSection, generateId, units, onAddUnit, dragHandlers, ingredientInputClass }: any) {
  return (
    <Card className="rounded-2xl md:rounded-[2.5rem] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-10 space-y-8 shadow-none md:shadow-sm">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-3 text-gray-800 dark:text-white font-headline">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400"><ShoppingBasket className="w-5 h-5" /></div>
            Nguyên liệu
          </h3>
          <Button type="button" variant="ghost" size="sm" onClick={() => addIngSection({ name: 'Nguyên liệu chính', ingredients: [{ id: generateId(), name: '', quantity: 1, unit: 'g' }] })} className="font-bold text-green-600 hover:bg-green-50 shadow-none px-2 md:px-3">
            <FolderPlus className="w-4 h-4 md:mr-1" />
            <span className="hidden md:inline">Thêm nhóm</span>
          </Button>
        </div>
        <div className="space-y-6 md:space-y-10">
          {ingSectionFields.map((section: any, sIdx: number) => (
            <div key={section.id} className="relative md:p-6 bg-transparent md:bg-gray-50 dark:md:bg-gray-900/50 rounded-none md:rounded-3xl border-none md:border md:border-dashed border-gray-200">
              <div className="flex items-center gap-4 mb-6">
                <Input placeholder="Tên nhóm (VD: Gia vị)..." {...form.register(`ingredientSections.${sIdx}.name`)} className="text-lg font-bold border-0 border-b-2 rounded-none px-0 bg-transparent focus-visible:ring-0 focus-visible:border-green-500 w-auto min-w-[200px] shadow-none" />
                <Button variant="ghost" size="icon" type="button" onClick={() => removeIngSection(sIdx)} disabled={ingSectionFields.length === 1} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-4 md:space-y-3">
                <IngredientsList 
                  sIdx={sIdx} control={form.control} register={form.register} setValue={form.setValue}
                  onDragStart={dragHandlers.onDragStart} onDrop={dragHandlers.onDrop}
                  dragState={dragHandlers.dragState} inputClass={ingredientInputClass}
                  units={units} onAddUnit={onAddUnit}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => {
                  const current = form.getValues(`ingredientSections.${sIdx}.ingredients`) || [];
                  form.setValue(`ingredientSections.${sIdx}.ingredients`, [...current, { id: generateId(), name: '', quantity: 1, unit: 'g' }]);
                }} className="mt-2 font-bold text-green-600/60 hover:text-green-600 ml-10 shadow-none"><PlusIcon className="w-4 h-4 mr-1" /> Thêm nguyên liệu</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function StepsEditorSection({ form, stepSectionFields, addStepSection, removeStepSection, generateId }: any) {
  return (
    <Card className="rounded-2xl md:rounded-[2.5rem] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-10 space-y-8 shadow-none md:shadow-sm">
      <div className="space-y-12">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-3 text-gray-800 dark:text-white font-headline">
            <div className="p-2 bg-orange-100 dark:bg-green-900/30 rounded-lg text-orange-600 dark:text-orange-400"><ChefHat className="w-6 h-6" /></div>
            Cách làm
          </h3>
          <Button type="button" variant="ghost" size="sm" onClick={() => addStepSection({ name: 'Thực hiện', steps: [{ id: generateId(), instruction: '', images: [] }] })} className="font-bold text-orange-600 hover:bg-orange-50 shadow-none px-2 md:px-3">
            <PlusIcon className="w-4 h-4 md:mr-1" />
            <span className="hidden md:inline">Thêm giai đoạn</span>
          </Button>
        </div>
        <div className="space-y-12">
          {stepSectionFields.map((section: any, sIdx: number) => (
            <div key={section.id} className="relative md:p-6 bg-transparent md:bg-gray-50 dark:md:bg-gray-900/50 rounded-none md:rounded-3xl border-none md:border md:border-dashed border-gray-200">
              <div className="flex items-center gap-4 mb-8">
                <Input placeholder="Tên giai đoạn (VD: Sơ chế)..." {...form.register(`stepSections.${sIdx}.name`)} className="text-lg font-bold border-0 border-b-2 rounded-none px-0 bg-transparent focus-visible:ring-0 focus-visible:border-orange-500 w-auto min-w-[200px] shadow-none" />
                <Button variant="ghost" size="icon" type="button" onClick={() => removeStepSection(sIdx)} disabled={stepSectionFields.length === 1} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
              </div>
              <StepsList sIdx={sIdx} form={form} register={form.register} setValue={form.setValue} generateId={generateId} />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function IngredientsList({ sIdx, control, register, setValue, onDragStart, onDrop, dragState, inputClass, units, onAddUnit }: any) {
  const ingredients = useWatch({ control, name: `ingredientSections.${sIdx}.ingredients` }) || [];
  return (
    <>
      {ingredients.map((ing: any, iIdx: number) => (
        <div 
          key={ing.id} 
          draggable 
          onDragStart={() => onDragStart(sIdx, iIdx)} 
          onDragOver={(e) => e.preventDefault()} 
          onDrop={() => onDrop(sIdx, iIdx)}
          className={cn(
            "flex gap-2 md:gap-3 items-center group/row transition-all duration-200 border-b md:border-none border-gray-100 pb-3 md:pb-0 last:border-0", 
            dragState?.sIdx === sIdx && dragState?.iIdx === iIdx ? "opacity-20" : "opacity-100"
          )}
        >
          <div className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 shrink-0">
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-3 min-w-0">
            <div className="flex-grow min-w-0">
              <Input 
                placeholder="Tên nguyên liệu" 
                {...register(`ingredientSections.${sIdx}.ingredients.${iIdx}.name`)} 
                className={cn(inputClass, "w-full h-11 pr-2")} 
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex-1 md:w-24">
                <Input 
                  placeholder="SL" 
                  {...register(`ingredientSections.${sIdx}.ingredients.${iIdx}.quantity`)} 
                  className={cn(inputClass, "w-full h-11 text-center px-1")} 
                />
              </div>
              <div className="flex-[1.5] md:w-32 min-w-0">
                <Select 
                  value={ing.unit || "_EMPTY_"} 
                  onValueChange={(val) => { 
                    if (val === "ADD_NEW") {
                      // Use setTimeout to avoid focus trap conflicts between Select and Dialog
                      setTimeout(() => onAddUnit(), 0);
                    }
                    else setValue(`ingredientSections.${sIdx}.ingredients.${iIdx}.unit`, val === "_EMPTY_" ? "" : val); 
                  }}
                >
                  <SelectTrigger className={cn(inputClass, "h-11 px-2 text-xs md:text-sm font-bold truncate")}>
                    <SelectValue placeholder="Đv" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl">
                    <SelectGroup>
                      <SelectLabel className="text-[10px] uppercase font-black text-gray-300">Chọn đơn vị</SelectLabel>
                      <SelectItem value="_EMPTY_" className="font-bold text-gray-400 italic">(Trống)</SelectItem>
                      <SelectItem value="g" className="font-bold">g</SelectItem>
                      <SelectItem value="ml" className="font-bold">ml</SelectItem>
                      {units.map((u: any) => u.name !== 'g' && u.name !== 'ml' && (
                        <SelectItem key={u.id} value={u.name} className="font-bold">{u.name}</SelectItem>
                      ))}
                      {ing.unit && ing.unit !== 'g' && ing.unit !== 'ml' && !units.some((u: any) => u.name === ing.unit) && (
                        <SelectItem value={ing.unit} className="font-bold italic">{ing.unit} (Cũ)</SelectItem>
                      )}
                    </SelectGroup>
                    <Separator className="my-1" />
                    <SelectItem value="ADD_NEW" className="text-blue-600 font-bold cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Plus className="w-3 h-3" /> Thêm mới
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            type="button" 
            className="text-gray-300 hover:text-red-500 shrink-0 shadow-none h-10 w-6 p-1 pr-0 flex justify-end items-center bg-transparent hover:bg-transparent"
            onClick={() => { 
              const current = control._formValues.ingredientSections[sIdx].ingredients; 
              if (current.length > 1) setValue(`ingredientSections.${sIdx}.ingredients`, current.filter((_: any, i: number) => i !== iIdx)); 
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </>
  );
}

function StepsList({ sIdx, form, register, setValue, generateId }: any) {
  const steps = useWatch({ control: form.control, name: `stepSections.${sIdx}.steps` }) || [];
  
  return (
    <div className="space-y-6 md:space-y-8">
      {steps.map((step: any, idx: number) => (
        <div key={step.id} className="flex gap-3 md:gap-6 items-stretch group/step">
          <div className="flex flex-col items-center shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs md:text-sm shrink-0 z-10 shadow-none">
              {idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div className="w-0.5 flex-grow bg-gray-100 dark:bg-gray-800 my-1 md:my-2 rounded-full" />
            )}
          </div>
          <div className="flex-grow pb-8 min-w-0">
            <div className="flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-border/50 overflow-hidden shadow-none">
              <RichTextToolbar 
                targetId={`step-${sIdx}-${idx}`} 
                className="border-none"
                renderRight={
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    type="button" 
                    onClick={() => { 
                      const current = steps; 
                      if (current.length > 1) setValue(`stepSections.${sIdx}.steps`, current.filter((_: any, i: number) => i !== idx)); 
                    }} 
                    className="text-gray-400 hover:text-red-500 transition-all shadow-none shrink-0 h-8 w-8 bg-transparent hover:bg-transparent"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                }
              />
              <Textarea 
                id={`step-${sIdx}-${idx}`} 
                placeholder={`Mô tả chi tiết bước ${idx + 1}...`} 
                {...register(`stepSections.${sIdx}.steps.${idx}.instruction`)} 
                className="bg-transparent border-none rounded-none p-4 text-base md:text-lg leading-relaxed focus-visible:ring-0 shadow-none resize-y min-h-[100px]" 
                rows={3} 
              />
            </div>
            
            <StepImageUploader 
              images={step.images || []} 
              onChange={(urls) => setValue(`stepSections.${sIdx}.steps.${idx}.images`, urls, { shouldDirty: true })} 
            />
          </div>
        </div>
      ))}
      <div className="pl-11 md:pl-16">
        <Button type="button" variant="ghost" size="sm" onClick={() => { const current = steps || []; setValue(`stepSections.${sIdx}.steps`, [...current, { id: generateId(), instruction: '', images: [] }]); }} className="font-bold text-orange-600/60 hover:text-orange-600 shadow-none hover:bg-orange-50"><PlusIcon className="w-4 h-4 mr-1" /> Thêm bước làm</Button>
      </div>
    </div>
  );
}

function StepImageUploader({ 
  images = [], 
  onChange 
}: { 
  images: string[], 
  onChange: (urls: string[]) => void 
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const newUrls = [];
      for (const file of files) {
        const url = await uploadImageToDrive(file);
        newUrls.push(url);
      }
      onChange([...images, ...newUrls]);
    } catch (error) {
      console.error('Step image upload failed', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const next = [...images];
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {images.map((url, idx) => (
        <div key={idx} className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border border-gray-100 group shadow-sm bg-gray-50">
          <img src={url} className="w-full h-full object-cover" alt="" />
          <button 
            type="button" 
            onClick={() => removeImage(idx)}
            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "w-24 h-24 md:w-32 md:h-32 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        {isUploading ? (
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        ) : (
          <ImagePlus className="w-6 h-6 text-gray-300" />
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          multiple 
          className="hidden" 
        />
      </div>
    </div>
  );
}
