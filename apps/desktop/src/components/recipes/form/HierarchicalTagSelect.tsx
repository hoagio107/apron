import { useState, useMemo, useEffect } from 'react';
import { Button, Popover, PopoverTrigger, PopoverContent, Checkbox, Chip, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@/ui';
import { FolderTree, ChevronRight, ChevronDown, Plus, Trash2, Edit2, MoreVertical, Search } from 'lucide-react';
import { DEFAULT_TAGS, type Tag } from '@apron/core';
import { FormField } from '../../shared/form';

interface HierarchicalTagSelectProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  error?: string;
  dynamicTags?: Tag[];
}

export function HierarchicalTagSelect({ selectedIds, onChange, error, dynamicTags }: HierarchicalTagSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  // Local state for all tags (mocking a database)
  const [allTags, setAllTags] = useState<Tag[]>(DEFAULT_TAGS);

  useEffect(() => {
    if (dynamicTags && dynamicTags.length > 0) {
      setAllTags(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const newItems = dynamicTags.filter(t => !existingIds.has(t.id));
        if (newItems.length === 0) return prev;
        return [...prev, ...newItems];
      });
    }
  }, [dynamicTags]);
  
  // State for creating a new tag
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagParent, setNewTagParent] = useState<string | null>(null);

  // State for editing a tag
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  // Build a tree from flat allTags
  type TreeNode = Tag & { children: TreeNode[] };
  const categoryTree = useMemo(() => {
    const rootNodes: TreeNode[] = [];
    const map = new Map<string, TreeNode>();
    
    allTags.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] });
    });
    
    allTags.forEach(cat => {
      const node = map.get(cat.id)!;
      if (cat.parent_id) {
        const parent = map.get(cat.parent_id);
        if (parent) {
          parent.children.push(node);
        } else {
          // Parent deleted or missing, treat as root
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });
    
    // Apply search filter if there is a query
    if (!searchQuery.trim()) {
      return rootNodes;
    }
    
    const query = searchQuery.toLowerCase();
    
    const filterNode = (node: TreeNode): TreeNode | null => {
      const matches = node.name.toLowerCase().includes(query);
      if (matches) {
        // If this node matches, we keep it and all its children
        return node;
      }
      
      const filteredChildren = node.children.map(filterNode).filter(Boolean) as TreeNode[];
      if (filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      
      return null;
    };
    
    return rootNodes.map(filterNode).filter(Boolean) as TreeNode[];
  }, [allTags, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onChange(Array.from(newSelected));
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    const newId = `tag-${Date.now()}`;
    const newTag: Tag = {
      id: newId,
      name: newTagName.trim(),
      slug: newTagName.trim().toLowerCase().replace(/\s+/g, '-'),
      parent_id: newTagParent || undefined
    };
    setAllTags(prev => [...prev, newTag]);
    setNewTagName('');
    setNewTagParent(null);
    setIsAdding(false);
    if (newTagParent) {
      setExpandedIds(prev => new Set(prev).add(newTagParent));
    }
  };

  const handleDeleteTag = (id: string) => {
    setAllTags(prev => prev.filter(t => t.id !== id && t.parent_id !== id));
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(sid => sid !== id));
    }
  };

  const handleSaveEdit = (id: string) => {
    if (!editingName.trim()) return;
    setAllTags(prev => prev.map(t => t.id === id ? { ...t, name: editingName.trim() } : t));
    setEditingId(null);
    setEditingName('');
  };

  const handleQuickAdd = (name: string) => {
    const newId = `tag-${Date.now()}`;
    const newTag: Tag = {
      id: newId,
      name: name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      parent_id: undefined
    };
    setAllTags(prev => [...prev, newTag]);
    onChange([...selectedIds, newId]);
    setSearchQuery('');
  };

  const exactMatchExists = useMemo(() => {
    return allTags.some(t => t.name.toLowerCase() === searchQuery.trim().toLowerCase());
  }, [allTags, searchQuery]);

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    // Always expand if there's a search query, otherwise respect expandedIds
    const isExpanded = !!searchQuery.trim() || expandedIds.has(node.id);
    const isSelected = selectedIds.includes(node.id);
    const isEditing = editingId === node.id;

    return (
      <div key={node.id} className="flex flex-col gap-1 w-full">
        <div 
          className={`flex items-center justify-between p-2 rounded-lg hover:bg-default-100 transition-colors ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren ? (
              <button 
                type="button" 
                onClick={() => toggleExpand(node.id)}
                className="p-1 rounded-md hover:bg-default-200 text-default-500 shrink-0"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-6 shrink-0" />
            )}
            
            {isEditing ? (
              <div className="flex gap-2 flex-1">
                <Input 
                  size="sm" 
                  value={editingName} 
                  onChange={e => setEditingName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveEdit(node.id)}
                  autoFocus
                />
                <Button size="sm" onClick={() => handleSaveEdit(node.id)}>Lưu</Button>
                <Button size="sm" variant="light" onClick={() => setEditingId(null)}>Hủy</Button>
              </div>
            ) : (
              <Checkbox 
                isSelected={isSelected} 
                onValueChange={() => toggleSelect(node.id)}
                classNames={{ label: "text-medium truncate" }}
              >
                {node.name}
              </Checkbox>
            )}
          </div>
          
          {!isEditing && (
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light" className="text-default-400">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Tag Actions">
                <DropdownItem 
                  key="add-child" 
                  startContent={<Plus className="w-4 h-4" />}
                  onPress={() => {
                    setNewTagParent(node.id);
                    setIsAdding(true);
                  }}
                >
                  Thêm tag con
                </DropdownItem>
                <DropdownItem 
                  key="edit" 
                  startContent={<Edit2 className="w-4 h-4" />}
                  onPress={() => {
                    setEditingId(node.id);
                    setEditingName(node.name);
                  }}
                >
                  Sửa tên
                </DropdownItem>
                <DropdownItem 
                  key="delete" 
                  className="text-danger" 
                  color="danger" 
                  startContent={<Trash2 className="w-4 h-4" />}
                  onPress={() => handleDeleteTag(node.id)}
                >
                  Xóa tag
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="flex flex-col gap-1 w-full">
            {node.children.map(child => renderNode(child as any, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const selectedCount = selectedIds.length;

  return (
    <FormField label="Tags (Phân cấp)" icon={FolderTree} error={error}>
      <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom-start" className="w-[400px]">
        <PopoverTrigger>
          <div 
            className={`
              min-h-10 px-3 py-2 rounded-medium cursor-pointer
              flex flex-wrap items-center gap-1.5 transition-colors
              ${error ? 'bg-danger-50' : 'bg-default-100 hover:bg-default-200'}
            `}
          >
            {selectedCount === 0 ? (
              <span className="text-default-500 text-sm">Chọn tags...</span>
            ) : (
              selectedIds.map(id => {
                const cat = allTags.find(c => c.id === id);
                return cat ? (
                  <Chip key={id} size="sm" variant="flat" color="primary">
                    {cat.name}
                  </Chip>
                ) : null;
              })
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent>
          <div className="flex flex-col w-full max-h-[500px] py-2">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-sm font-semibold">Quản lý Tags</span>
              <Button size="sm" variant="light" startContent={<Plus className="w-4 h-4" />} onPress={() => {
                setNewTagParent(null);
                setIsAdding(true);
              }}>
                Tag gốc mới
              </Button>
            </div>

            <div className="px-3 mb-2">
              <Input
                size="sm"
                placeholder="Tìm kiếm hoặc tạo tag nhanh..."
                startContent={<Search className="w-4 h-4 text-default-400" />}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchQuery.trim() && !exactMatchExists) {
                    e.preventDefault();
                    handleQuickAdd(searchQuery.trim());
                  }
                }}
                isClearable
                onClear={() => setSearchQuery('')}
              />
            </div>
            
            {searchQuery.trim() && !exactMatchExists && (
              <div className="px-3 mb-2">
                <Button 
                  size="sm" 
                  variant="flat" 
                  color="primary" 
                  className="w-full justify-start"
                  startContent={<Plus className="w-4 h-4" />}
                  onPress={() => handleQuickAdd(searchQuery.trim())}
                >
                  Thêm & chọn nhanh: "{searchQuery.trim()}"
                </Button>
              </div>
            )}
            
            {isAdding && (
              <div className="px-3 py-2 bg-default-50 rounded-lg mx-2 mb-2 flex flex-col gap-2 border border-divider">
                <div className="text-xs text-default-500">
                  {newTagParent 
                    ? `Thêm tag con cho: ${allTags.find(t => t.id === newTagParent)?.name}` 
                    : 'Thêm tag gốc mới'}
                </div>
                <div className="flex gap-2">
                  <Input 
                    size="sm" 
                    placeholder="Tên tag..." 
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                    autoFocus
                  />
                  <Button size="sm" color="primary" onPress={handleAddTag}>Thêm</Button>
                  <Button size="sm" variant="light" onPress={() => setIsAdding(false)}>Hủy</Button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1 w-full overflow-y-auto px-1 flex-1">
              {categoryTree.map(rootNode => renderNode(rootNode))}
              {categoryTree.length === 0 && !isAdding && (
                <div className="text-center text-default-500 py-4">
                  Chưa có tag nào.
                </div>
              )}
            </div>
            
            <div className="bg-background pt-3 mt-2 px-3 border-t border-divider flex justify-end shrink-0">
              <Button color="primary" onPress={() => setIsOpen(false)}>
                Xong
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </FormField>
  );
}
