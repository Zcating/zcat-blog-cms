import { useState, useRef, useImperativeHandle, forwardRef } from 'react';

interface AlbumData {
  name: string;
  description: string;
}

interface CreateAlbumDialogRef {
  open: (options?: {
    title?: string;
    onSubmit?: (data: AlbumData) => Promise<void>;
  }) => Promise<AlbumData | null>;
  close: () => void;
}

interface CreateAlbumDialogProps {
  // 可以添加默认配置
}

const CreateAlbumDialog = forwardRef<
  CreateAlbumDialogRef,
  CreateAlbumDialogProps
>((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('新增相册');
  
  const resolveRef = useRef<((value: AlbumData | null) => void) | null>(null);
  const onSubmitRef = useRef<((data: AlbumData) => Promise<void>) | null>(null);

  const handleClose = () => {
    if (isSubmitting) return;
    
    setAlbumName('');
    setAlbumDescription('');
    setIsOpen(false);
    
    // 如果有等待的 Promise，则 resolve 为 null（表示取消）
    if (resolveRef.current) {
      resolveRef.current(null);
      resolveRef.current = null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumName.trim() || isSubmitting) return;

    const data: AlbumData = {
      name: albumName.trim(),
      description: albumDescription.trim(),
    };

    setIsSubmitting(true);
    try {
      // 如果有自定义的 onSubmit 处理器，先执行它
      if (onSubmitRef.current) {
        await onSubmitRef.current(data);
      }

      // 成功后清理表单并关闭对话框
      setAlbumName('');
      setAlbumDescription('');
      setIsOpen(false);
      
      // resolve Promise 并返回数据
      if (resolveRef.current) {
        resolveRef.current(data);
        resolveRef.current = null;
      }
    } catch (error) {
      console.error('创建相册失败:', error);
      // 错误时不关闭对话框，让用户可以重试
    } finally {
      setIsSubmitting(false);
    }
  };

  useImperativeHandle(ref, () => ({
    open: (options = {}) => {
      return new Promise<AlbumData | null>((resolve) => {
        setTitle(options.title || '新增相册');
        onSubmitRef.current = options.onSubmit || null;
        resolveRef.current = resolve;
        setIsOpen(true);
      });
    },
    close: handleClose,
  }));

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">{title}</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">相册名称 *</span>
            </label>
            <input
              type="text"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              className="input input-bordered w-full"
              placeholder="请输入相册名称"
              required
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text">相册描述</span>
            </label>
            <textarea
              value={albumDescription}
              onChange={(e) => setAlbumDescription(e.target.value)}
              className="textarea textarea-bordered w-full"
              placeholder="请输入相册描述（可选）"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !albumName.trim()}
            >
              {isSubmitting ? '创建中...' : '创建相册'}
            </button>
          </div>
        </form>
      </div>

      {/* 点击背景关闭对话框 */}
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
});

CreateAlbumDialog.displayName = 'CreateAlbumDialog';

export { CreateAlbumDialog };
export type { CreateAlbumDialogRef, AlbumData };
