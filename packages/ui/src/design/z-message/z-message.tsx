import { createRoot, type Root } from 'react-dom/client';
import { toast } from 'sonner';

import { Toaster } from '../../shadcn/ui/sonner';

let toasterRoot: Root | null = null;
async function install() {
  if (toasterRoot) {
    return;
  }
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  root.render(<Toaster />);
  toasterRoot = root;

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve(undefined);
    });
  });
  // const remove = () => {
  //   root.unmount();
  //   if (document.body.contains(container)) {
  //     document.body.removeChild(container);
  //   }
  // };
}

export const ZMessage = {
  async show(message: string) {
    await install();
    toast(message);
  },
  async success(message: string) {
    await install();
    toast.success(message);
  },
  async error(message: string) {
    await install();
    toast.error(message);
  },
  async info(message: string) {
    await install();
    toast.info(message);
  },
  async loading(message: string) {
    await install();
    const id = toast.loading(message);
    return () => {
      toast.dismiss(id);
    };
  },
  async warning(message: string) {
    await install();
    toast.warning(message);
  },
};

export const ZMessageToaster = Toaster;
