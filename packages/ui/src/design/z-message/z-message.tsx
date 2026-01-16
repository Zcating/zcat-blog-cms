import { createRoot, type Root } from 'react-dom/client';
import { toast } from 'sonner';

import { Toaster } from '../../shadcn/ui/sonner';

let toasterRoot: Root | null = null;
function install() {
  if (toasterRoot) {
    return;
  }
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  root.render(<Toaster />);
  toasterRoot = root;
  // const remove = () => {
  //   root.unmount();
  //   if (document.body.contains(container)) {
  //     document.body.removeChild(container);
  //   }
  // };
}

export const ZMessage = {
  show(message: string) {
    install();
    toast(message);
  },
  success(message: string) {
    install();
    toast.success(message);
  },
  error(message: string) {
    install();
    toast.error(message);
  },
  info(message: string) {
    install();
    toast.info(message);
  },
  loading(message: string) {
    install();
    const id = toast.loading(message);
    return () => {
      toast.dismiss(id);
    };
  },
  warning(message: string) {
    install();
    toast.warning(message);
  },
};
export const ZToaster = Toaster;
