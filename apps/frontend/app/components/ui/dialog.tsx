import { Button } from './button';
import { Modal } from './modal';
import { Row } from './row';

export namespace Dialog {
  interface ConfirmDialogProps {
    title: string;
    content: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
  }
  export async function confirm(props: ConfirmDialogProps): Promise<boolean> {
    const { title, content, confirmText = '确定', cancelText = '取消' } = props;

    const confirm = await Modal.open((resolve) => {
      const onConfirm = () => {
        resolve(true);
      };
      const onCancel = () => {
        resolve(false);
      };
      return {
        children: (
          <div className="space-y-5">
            <div className="text-xl font-bold">{title}</div>
            <div>{content}</div>
            <Row gap="5" justify="end">
              <Button variant="primary" onClick={onConfirm}>
                {confirmText}
              </Button>
              <Button onClick={onCancel}>{cancelText}</Button>
            </Row>
          </div>
        ),
      };
    });

    return !!confirm;
  }
}
