
"use client";

import { useState } from 'react';
import { useUnits } from '@/hooks/use-units';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Scale, ArrowLeft, Plus, Trash2, ArrowLeftRight, 
  Loader2, Info, X, Check, DatabaseZap, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';

export default function UnitsPage() {
  const isMobile = useIsMobile();
  const { units, loading, addUnit, updateUnit, deleteUnit } = useUnits();
  const { toast } = useToast();
  const router = useRouter();

  const [newUnitName, setNewUnitName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [convertData, setConvertData] = useState({ rate: 1, base_unit: '' });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<string | null>(null);

  const handleAddUnit = async () => {
    const name = newUnitName.trim();
    if (!name) return;
    if (units.some(u => u.name.toLowerCase() === name.toLowerCase())) {
      toast({ variant: "destructive", title: "Chú ý", description: "Đơn vị này đã tồn tại." });
      return;
    }
    setIsSaving(true);
    try {
      await addUnit(name);
      setNewUnitName('');
      toast({ title: "Thành công", description: "Đã thêm đơn vị mới." });
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể thêm đơn vị." });
    } finally {
      setIsSaving(false);
    }
  };

  const openConvertModal = (unit: any) => {
    setEditingUnit(unit);
    setConvertData({
      rate: unit.conversion_rate || 1,
      base_unit: unit.base_unit || ''
    });
    setIsConvertModalOpen(true);
  };

  const saveConversion = async () => {
    if (!editingUnit) return;
    setIsSaving(true);
    try {
      await updateUnit(editingUnit.id, {
        conversion_rate: convertData.rate,
        base_unit: convertData.base_unit
      });
      toast({ title: "Thành công", description: "Đã lưu quy đổi." });
      setIsConvertModalOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể lưu." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setUnitToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!unitToDelete) return;
    try {
      await deleteUnit(unitToDelete);
      toast({ title: "Đã xóa thành công" });
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi khi xóa" });
    } finally {
      setUnitToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const NavbarContent = () => (
    <>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full shadow-none text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className={cn("font-bold truncate font-headline", isMobile ? "text-sm max-w-[180px]" : "text-xl")}>
          Đơn vị tính
        </h1>
      </div>
    </>
  );

  const AddUnitBox = () => (
    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800">
      <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5" /> Thêm mới
      </h4>
      <div className="flex gap-2">
        <Input 
          placeholder="Tên đơn vị (lon, chai...)" 
          value={newUnitName}
          onChange={(e) => setNewUnitName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
          className="h-12 bg-white dark:bg-gray-900 border-none rounded-xl shadow-none font-bold flex-1"
        />
        <Button 
          onClick={handleAddUnit} 
          disabled={isSaving || !newUnitName.trim()} 
          className="h-12 w-12 shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200/20 transition-all active:scale-95 p-0 border-none"
        >
          {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Plus className="w-6 h-6" />}
        </Button>
      </div>
    </div>
  );

  const SmartGuide = () => (
    <div className="bg-gray-100 dark:bg-gray-900/50 p-6 rounded-3xl border border-transparent flex gap-4">
      <AlertCircle className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
      <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
        <p className="mb-2"><strong className="text-gray-800 dark:text-gray-200">Tại sao cần quy đổi?</strong> CookPal sẽ tự động cộng dồn nguyên liệu nếu chúng có chung một đơn vị gốc.</p>
        <p>Hãy luôn quy đổi về đơn vị nhỏ nhất để tính toán chính xác nhất.</p>
      </div>
    </div>
  );

  const UnitsList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {units.map((unit) => (
        <div key={unit.id} className="group flex items-center justify-between p-5 rounded-3xl bg-white dark:bg-gray-800 border-none md:border-2 md:border-transparent md:hover:border-blue-200 transition-all shadow-none md:shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-blue-500 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-800 dark:text-white truncate">{unit.name}</p>
              {unit.conversion_rate && unit.base_unit && (
                <p className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-lg uppercase mt-1 inline-block">
                  1 {unit.name} = {unit.conversion_rate}{unit.base_unit}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => openConvertModal(unit)} className="text-blue-600 hover:bg-blue-100 rounded-xl h-10 w-10">
              <ArrowLeftRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(unit.id)} className="text-gray-300 hover:text-red-500 rounded-xl h-10 w-10">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
      {units.length === 0 && (
        <div className="col-span-full py-24 flex flex-col items-center justify-center text-gray-400 font-medium">
          <Scale className="w-16 h-16 mb-4 opacity-20" />
          <p>Chưa có đơn vị nào được tạo.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <header className={cn(
        "fixed top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-none",
        isMobile ? "left-0 right-0 h-14 px-4" : "left-64 right-0 h-16 px-8"
      )}>
        <NavbarContent />
      </header>

      <main className={cn("max-w-7xl mx-auto px-4 md:px-8", isMobile ? "pt-20" : "pt-24")}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="space-y-6">
              <AddUnitBox />
              <div className="hidden md:block">
                <SmartGuide />
              </div>
            </div>
          </div>
          <div className="lg:col-span-8">
            <div className="min-h-[600px] space-y-8">
              <div className="px-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Danh sách hiện có ({units.length})</label>
              </div>
              {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
              ) : (
                <UnitsList />
              )}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isConvertModalOpen} onOpenChange={setIsConvertModalOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden shadow-2xl border-none">
          <DialogHeader className="p-6 bg-gray-50/50 border-b">
            <DialogTitle className="flex items-center gap-2 font-headline">
              <ArrowLeftRight className="w-5 h-5 text-blue-500" /> Thiết lập quy đổi
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-8 space-y-8">
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Quy đổi đơn vị</p>
              <div className="text-3xl font-black text-gray-800">1 {editingUnit?.name} = </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số lượng</label>
                <Input 
                  type="number"
                  step="any"
                  value={convertData.rate}
                  onChange={(e) => setConvertData({...convertData, rate: parseFloat(e.target.value)})}
                  className="h-14 text-center font-black text-xl rounded-2xl bg-gray-50 border-none shadow-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Đơn vị gốc</label>
                <select 
                  value={convertData.base_unit}
                  onChange={(e) => setConvertData({...convertData, base_unit: e.target.value})}
                  className="w-full h-14 rounded-2xl border-none bg-gray-50 px-4 text-base font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-none appearance-none"
                >
                  <option value="">-- Chọn --</option>
                  {units.filter(u => u.id !== editingUnit?.id).map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 bg-white">
            <Button onClick={saveConversion} disabled={isSaving || !convertData.base_unit || !convertData.rate} className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 text-white border-none">
              {isSaving ? <Loader2 className="animate-spin" /> : 'Lưu thiết lập'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Xóa đơn vị tính?"
        message="Hành động này có thể ảnh hưởng đến việc tính toán nguyên liệu của các công thức đang sử dụng đơn vị này. Bạn có chắc chắn muốn xóa không?"
        confirmText="Xóa đơn vị"
      />
    </div>
  );
}
