import { getCurrentWindow } from '@tauri-apps/api/window';

export function WindowControls() {
  const handleMinimize = () => getCurrentWindow().minimize();
  const handleMaximize = () => getCurrentWindow().toggleMaximize();
  const handleClose = () => getCurrentWindow().close();

  return (
    <div className="flex items-center gap-2">
      <button 
        title="Đóng (Close)"
        onClick={handleClose}
        className="w-3.5 h-3.5 rounded-full bg-danger hover:brightness-110 transition-all outline-none border border-black/10"
      />
      <button 
        title="Thu nhỏ (Minimize)"
        onClick={handleMinimize}
        className="w-3.5 h-3.5 rounded-full bg-warning hover:brightness-110 transition-all outline-none border border-black/10"
      />
      <button 
        title="Phóng to (Maximize)"
        onClick={handleMaximize}
        className="w-3.5 h-3.5 rounded-full bg-success hover:brightness-110 transition-all outline-none border border-black/10"
      />
    </div>
  );
}
