import { Drawer, DrawerContent, DrawerHeader, DrawerBody, Button, CheckboxGroup, Checkbox, RadioGroup, Radio } from '@apron/ui';
import { Filter, Check } from 'lucide-react';

export interface RecipeFilterState {
  difficulties: string[];
  maxTime: number | null; // minutes
  tags: string[];
  cookedStatus?: 'all' | 'cooked' | 'uncooked';
  minRating?: number;
}

export const defaultFilterState: RecipeFilterState = {
  difficulties: [],
  maxTime: null,
  tags: [],
  cookedStatus: 'all',
  minRating: 0
};

interface RecipeFilterDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: RecipeFilterState;
  onFilterChange: (filters: RecipeFilterState) => void;
  availableTags?: string[];
}

export function RecipeFilterDrawer({ 
  isOpen, 
  onOpenChange, 
  filters, 
  onFilterChange, 
  availableTags = [] 
}: RecipeFilterDrawerProps) {
  
  const timeOptions = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Dưới 15 phút', value: '15' },
    { label: 'Dưới 30 phút', value: '30' },
    { label: 'Dưới 60 phút', value: '60' },
  ];

  const handleClear = () => {
    onFilterChange(defaultFilterState);
  };

  return (
    <Drawer isOpen={isOpen} onOpenChange={onOpenChange} size="sm" placement="right" radius="none">
      <DrawerContent>
        {() => (
          <>
            <DrawerHeader className="flex justify-between items-center border-b border-divider">
              <div className="flex gap-2 items-center">
                <Filter className="w-5 h-5" />
                <span className="text-lg">Lọc công thức</span>
              </div>
            </DrawerHeader>
            <DrawerBody className="py-6">
              <div className="flex flex-col gap-8">
                
                <CheckboxGroup
                  label="Độ khó"
                  value={filters.difficulties}
                  onValueChange={(val) => onFilterChange({ ...filters, difficulties: val })}
                  orientation="horizontal"
                >
                  <Checkbox value="Dễ">Dễ</Checkbox>
                  <Checkbox value="Vừa">Vừa</Checkbox>
                  <Checkbox value="Khó">Khó</Checkbox>
                </CheckboxGroup>

                <RadioGroup
                  label="Thời gian nấu"
                  value={filters.maxTime ? filters.maxTime.toString() : 'all'}
                  onValueChange={(val) => onFilterChange({ 
                    ...filters, 
                    maxTime: val === 'all' ? null : parseInt(val) 
                  })}
                >
                  {timeOptions.map(opt => (
                    <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>
                  ))}
                </RadioGroup>

                <RadioGroup
                  label="Trạng thái nấu"
                  value={filters.cookedStatus || 'all'}
                  onValueChange={(val) => onFilterChange({ ...filters, cookedStatus: val as any })}
                >
                  <Radio value="all">Tất cả</Radio>
                  <Radio value="cooked">Đã nấu</Radio>
                  <Radio value="uncooked">Chưa nấu</Radio>
                </RadioGroup>

                <RadioGroup
                  label="Đánh giá tối thiểu"
                  value={filters.minRating?.toString() || '0'}
                  onValueChange={(val) => onFilterChange({ ...filters, minRating: parseInt(val) })}
                >
                  <Radio value="0">Tất cả</Radio>
                  <Radio value="5">5 sao</Radio>
                  <Radio value="4">Từ 4 sao trở lên</Radio>
                  <Radio value="3">Từ 3 sao trở lên</Radio>
                </RadioGroup>

                {availableTags && availableTags.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-medium text-foreground">Thẻ (Tags)</span>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map(tag => {
                        const isSelected = (filters.tags || []).includes(tag);
                        return (
                          <div 
                            key={tag}
                            onClick={() => {
                              const newTags = isSelected 
                                ? (filters.tags || []).filter(t => t !== tag)
                                : [...(filters.tags || []), tag];
                              onFilterChange({ ...filters, tags: newTags });
                            }}
                            className={`
                              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all
                              ${isSelected ? 'bg-primary text-white shadow-md' : 'bg-default-100 text-default-700 hover:bg-default-200'}
                            `}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                            {tag}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <Button 
                    fullWidth 
                    variant="flat" 
                    color="danger" 
                    onPress={handleClear}
                  >
                    Xóa tất cả bộ lọc
                  </Button>
                </div>
              </div>
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
