import { toast } from 'sonner';

import { Toaster } from '../../shadcn/ui/sonner';

export const ZMessage = {
  show(message: string) {
    toast(message);
  },
  success(message: string) {
    toast.success(message);
  },
  error(message: string) {
    toast.error(message);
  },
  info(message: string) {
    toast.info(message);
  },
  loading(message: string) {
    const id = toast.loading(message);
    return () => {
      toast.dismiss(id);
    };
  },
  warning(message: string) {
    toast.warning(message);
  },
};
export const ZToaster = Toaster;
