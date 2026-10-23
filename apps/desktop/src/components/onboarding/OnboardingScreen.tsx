import { useState } from 'react';
import { Button, Input } from '@/ui';
import { Folder, ArrowRight, User, Plus } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { getStorageProvider } from '@apron/core';

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface SavedAccount {
  id: string;
  name: string;
  path: string;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [accounts, setAccounts] = useState<SavedAccount[]>(() => {
    try {
      const saved = localStorage.getItem('apron_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [view, setView] = useState<'list' | 'create'>(accounts.length > 0 ? 'list' : 'create');

  const [accountName, setAccountName] = useState('');
  const [storagePath, setStoragePath] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState('');

  const handleSelectFolder = async () => {
    try {
      setIsSelecting(true);
      setError('');
      
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Chọn thư mục để lưu dữ liệu (BYOS)'
      });
      
      if (selected && typeof selected === 'string') {
        setStoragePath(selected);
      }
    } catch (err) {
      console.error('Failed to select folder:', err);
      setError('Có lỗi xảy ra khi chọn thư mục. Vui lòng thử lại.');
    } finally {
      setIsSelecting(false);
    }
  };

  const handleStart = async () => {
    if (!accountName.trim()) {
      setError('Vui lòng nhập Tên tài khoản.');
      return;
    }
    if (!storagePath) {
      setError('Vui lòng chọn thư mục lưu trữ.');
      return;
    }

    try {
      const newAccount: SavedAccount = {
        id: crypto.randomUUID(),
        name: accountName.trim(),
        path: storagePath
      };
      
      const updatedAccounts = [...accounts, newAccount];
      localStorage.setItem('apron_accounts', JSON.stringify(updatedAccounts));
      setAccounts(updatedAccounts);
      
      // Save account name for current session
      localStorage.setItem('account_name', newAccount.name);
      
      // Update storage provider
      const provider = getStorageProvider() as any;
      if (provider.setBaseDir) {
        await provider.setBaseDir(storagePath);
      } else {
        // Fallback if not TauriStorageProvider (e.g., mock environment)
        localStorage.setItem('byos_base_dir', storagePath);
      }
      
      onComplete();
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Không thể lưu cài đặt. Vui lòng thử lại.');
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-content1 rounded-2xl shadow-large p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Chào mừng đến với Cookbook</h1>
          <p className="text-default-500 mt-2 text-sm">
            {view === 'list' ? 'Chọn tài khoản của bạn để tiếp tục' : 'Cài đặt thông tin cá nhân và nơi lưu trữ dữ liệu'}
          </p>
        </div>

        {view === 'list' ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-default-200 hover:border-primary hover:bg-primary-50 transition-colors text-left"
                  onClick={async () => {
                    localStorage.setItem('account_name', acc.name);
                    const provider = getStorageProvider() as any;
                    if (provider.setBaseDir) {
                      await provider.setBaseDir(acc.path);
                    } else {
                      localStorage.setItem('byos_base_dir', acc.path);
                    }
                    onComplete();
                  }}
                >
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-semibold text-foreground truncate">{acc.name}</h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-default-500">
                      <Folder className="w-3 h-3 shrink-0" />
                      <span className="truncate">{acc.path}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <Button
              className="w-full mt-4"
              variant="flat"
              color="primary"
              startContent={<Plus className="w-4 h-4" />}
              onPress={() => setView('create')}
            >
              Thêm tài khoản / Vault mới
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Input
              label="Tên sổ tay / Tài khoản"
              placeholder="VD: Nhà bếp của bếp trưởng"
              value={accountName}
              onValueChange={setAccountName}
              startContent={<User className="w-4 h-4 text-default-400" />}
              isRequired
              variant="faded"
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Vị trí lưu trữ dữ liệu <span className="text-danger">*</span>
              </label>
              <p className="text-xs text-default-500 mb-3">
                Toàn bộ công thức và hình ảnh sẽ được lưu tại đây. Khuyên dùng Google Drive, OneDrive để đồng bộ đa thiết bị.
              </p>
              
              {storagePath ? (
                <div className="flex items-center justify-between p-3 border border-success-200 bg-success-50 rounded-xl">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Folder className="w-4 h-4 text-success-600 shrink-0" />
                    <span className="text-sm font-medium text-success-700 truncate" title={storagePath}>
                      {storagePath}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="flat" 
                    color="success" 
                    onPress={handleSelectFolder}
                    isLoading={isSelecting}
                  >
                    Đổi
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  variant="flat"
                  color="primary"
                  startContent={<Folder className="w-4 h-4" />}
                  onPress={handleSelectFolder}
                  isLoading={isSelecting}
                >
                  Chọn thư mục trên máy
                </Button>
              )}
            </div>

            {error && (
              <p className="text-danger text-sm text-center bg-danger-50 p-2 rounded-lg">{error}</p>
            )}

            <div className="flex flex-col gap-2 mt-4">
              <Button
                className="w-full"
                color="primary"
                endContent={<ArrowRight className="w-4 h-4" />}
                onPress={handleStart}
                isDisabled={!accountName.trim() || !storagePath}
              >
                Bắt đầu sử dụng
              </Button>
              {accounts.length > 0 && (
                <Button
                  className="w-full"
                  variant="light"
                  onPress={() => setView('list')}
                >
                  Quay lại danh sách
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
