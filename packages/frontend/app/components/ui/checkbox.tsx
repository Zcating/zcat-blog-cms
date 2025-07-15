import { tv } from "tailwind-variants";
import { Input } from "./input";
import { classnames } from "../utils";

type CheckboxVariant = 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error';

const checkbox = tv({
  base: 'checkbox',
  variants: {
    variant: {
      primary: 'checkbox-primary',
      secondary: 'checkbox-secondary',
      accent: 'checkbox-accent',
      neutral: 'checkbox-neutral',
      info: 'checkbox-info',
      success: 'checkbox-success',
      warning: 'checkbox-warning',
      error: 'checkbox-error',
    }
  }
})

interface CheckboxProps {
  variant: CheckboxVariant;
  value?: boolean;
  onChange?: (value: boolean) => void;
}
export function Checkbox(props: CheckboxProps) {
  return (
    <input
      className={checkbox({ variant: props.variant })}
      type="checkbox"
      checked={props.value}
      onChange={(e) => props.onChange?.(e.target.checked)}
    />
  );
}