import { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent, Button, Tabs, Tab } from '@apron/ui';
import * as LucideIcons from 'lucide-react';
import { Info, ChevronDown } from 'lucide-react';

export interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function IconRenderer({ value, className = 'w-5 h-5' }: { value?: string, className?: string }) {
  const isCustomSvg = value?.trim().startsWith('<svg');
  const SelectedIcon = !isCustomSvg && value && (LucideIcons as any)[value] ? (LucideIcons as any)[value] : null;

  if (!value) return null;

  if (isCustomSvg) {
    return (
      <div 
        className={`flex items-center justify-center [&>svg]:w-full [&>svg]:h-full ${className}`} 
        dangerouslySetInnerHTML={{ __html: value }} 
      />
    );
  }

  if (SelectedIcon) {
    return <SelectedIcon className={className} />;
  }

  // Fallback if it's just an emoji or string
  return <span>{value}</span>;
}

const COMMON_ICONS = [
  'Book', 'BookOpen', 'Video', 'PlayCircle', 'FileText', 'File', 'Folder', 'FolderOpen',
  'Star', 'Heart', 'Award', 'CheckCircle', 'Code', 'Terminal', 'Cpu', 'Database',
  'PenTool', 'Edit', 'Image', 'Camera', 'Music', 'Headphones', 'Mic', 'Speaker',
  'Layout', 'Grid', 'List', 'Maximize', 'PieChart', 'BarChart', 'TrendingUp',
  'Users', 'User', 'Briefcase', 'Globe', 'Map', 'Compass', 'Navigation',
  'Settings', 'Tool', 'Wrench', 'Shield', 'Lock', 'Unlock', 'Key'
];

export function IconPicker({ value, onChange, className = '' }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customSvg, setCustomSvg] = useState('');

  // Check if value is a custom SVG or a lucide icon name
  const isCustomSvg = value?.trim().startsWith('<svg');
  const SelectedIcon = !isCustomSvg && value && (LucideIcons as any)[value] ? (LucideIcons as any)[value] : LucideIcons.BookOpen;

  const handleSelectIcon = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
  };

  const handleSaveCustomSvg = () => {
    if (customSvg.trim()) {
      onChange(customSvg);
      setIsOpen(false);
    }
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom-start">
      <PopoverTrigger>
        <Button 
          isIconOnly 
          variant="light" 
          className={`shrink-0 text-default-600 w-10 h-10 ${className}`}
          aria-label="Chọn biểu tượng"
        >
          {isCustomSvg || (value && (LucideIcons as any)[value]) ? (
            <IconRenderer value={value} className="w-5 h-5" />
          ) : (
            <LucideIcons.BookOpen className="w-5 h-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3">
        <Tabs aria-label="Icon Options" className="w-full" fullWidth>
          <Tab key="presets" title="Icon thư viện">
            <div className="relative">
              <div className="grid grid-cols-6 gap-2 p-2 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-8">
                {COMMON_ICONS.map(iconName => {
                  const Icon = (LucideIcons as any)[iconName];
                  if (!Icon) return null;
                  const isSelected = !isCustomSvg && value === iconName;
                  return (
                    <Button
                      key={iconName}
                      isIconOnly
                      variant={isSelected ? "solid" : "light"}
                      color={isSelected ? "primary" : "default"}
                      onPress={() => handleSelectIcon(iconName)}
                    >
                      <Icon className="w-5 h-5" />
                    </Button>
                  );
                })}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-1">
                <ChevronDown className="w-4 h-4 text-default-400 animate-bounce" />
              </div>
            </div>
          </Tab>
          <Tab key="custom" title="SVG tuỳ chỉnh">
            <div className="flex flex-col gap-3 p-2">
              <div className="flex items-start gap-2 text-xs text-default-500 bg-default-100 p-2 rounded-lg">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Dán mã SVG của bạn vào đây. Khuyến nghị SVG có kích thước 24x24 hoặc sử dụng viewBox.</p>
              </div>
              <textarea 
                className="w-full h-32 p-3 text-sm rounded-xl bg-default-100 outline-none resize-none"
                placeholder="<svg>...</svg>"
                value={customSvg}
                onChange={e => setCustomSvg(e.target.value)}
              />
              <Button color="primary" onPress={handleSaveCustomSvg} className="w-full">
                Sử dụng SVG
              </Button>
            </div>
          </Tab>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
