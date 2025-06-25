import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

// 字段类型定义
export type FieldType = 'text' | 'textarea' | 'email' | 'password' | 'number' | 'select';

// 字段配置接口
export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null; // 返回错误信息或null
  };
  options?: { value: string; label: string }[]; // 用于select类型
  rows?: number; // 用于textarea
  disabled?: boolean;
}

// 表单配置接口
export interface FormConfig {
  title: string;
  fields: FormField[];
  submitText?: string;
  cancelText?: string;
}

// 组件Props接口
export interface ConfigurableFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  config: FormConfig;
  initialData?: Record<string, any>;
}

// 验证函数
function validateField(field: FormField, value: any): string | null {
  if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return `${field.label}是必填项`;
  }

  if (value && field.validation) {
    const { minLength, maxLength, pattern, custom } = field.validation;
    
    if (minLength && value.length < minLength) {
      return `${field.label}至少需要${minLength}个字符`;
    }
    
    if (maxLength && value.length > maxLength) {
      return `${field.label}不能超过${maxLength}个字符`;
    }
    
    if (pattern && !pattern.test(value)) {
      return `${field.label}格式不正确`;
    }
    
    if (custom) {
      const customError = custom(value);
      if (customError) return customError;
    }
  }

  return null;
}

export function ConfigurableFormDialog({
  isOpen,
  onClose,
  onSubmit,
  config,
  initialData = {},
}: ConfigurableFormDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    const initData: Record<string, any> = {};
    config.fields.forEach(field => {
      initData[field.name] = initialData[field.name] || '';
    });
    setFormData(initData);
    setErrors({});
  }, [config.fields, initialData, isOpen]);

  const handleClose = () => {
    if (isSubmitting) return;
    setFormData({});
    setErrors({});
    onClose();
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // 清除该字段的错误
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    config.fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 处理数据，去除空白字符
      const processedData: Record<string, any> = {};
      config.fields.forEach(field => {
        const value = formData[field.name];
        processedData[field.name] = typeof value === 'string' ? value.trim() : value;
      });

      await onSubmit(processedData);
      handleClose();
    } catch (error) {
      console.error('表单提交失败:', error);
      // 错误处理由父组件负责
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';
    const hasError = !!errors[field.name];
    const isFieldDisabled = isSubmitting || field.disabled;

    const baseInputClasses = clsx(
      'w-full',
      hasError ? 'input-error' : 'input-bordered',
      isFieldDisabled && 'input-disabled'
    );

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={clsx('textarea', baseInputClasses)}
            placeholder={field.placeholder}
            rows={field.rows || 3}
            disabled={isFieldDisabled}
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={clsx('select', baseInputClasses)}
            disabled={isFieldDisabled}
          >
            <option value="">{field.placeholder || '请选择'}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={clsx('input', baseInputClasses)}
            placeholder={field.placeholder}
            disabled={isFieldDisabled}
          />
        );
    }
  };

  if (!isOpen) return null;

  const hasErrors = Object.keys(errors).length > 0;
  const hasRequiredFields = config.fields.some(field => field.required);
  const isFormValid = config.fields.every(field => {
    if (field.required) {
      const value = formData[field.name];
      return value && (typeof value !== 'string' || value.trim());
    }
    return true;
  });

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-4">{config.title}</h3>

        <form onSubmit={handleSubmit}>
          {config.fields.map((field, index) => (
            <div key={field.name} className={clsx('form-control', index < config.fields.length - 1 && 'mb-4')}>
              <label className="label">
                <span className="label-text">
                  {field.label}
                  {field.required && <span className="text-error ml-1">*</span>}
                </span>
              </label>
              
              {renderField(field)}
              
              {errors[field.name] && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors[field.name]}</span>
                </label>
              )}
            </div>
          ))}

          <div className="modal-action mt-6">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {config.cancelText || '取消'}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || hasErrors || !isFormValid}
            >
              {isSubmitting ? '提交中...' : (config.submitText || '确定')}
            </button>
          </div>
        </form>
      </div>

      {/* 点击背景关闭对话框 */}
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}

// 预设配置示例
export const createAlbumFormConfig: FormConfig = {
  title: '新增相册',
  fields: [
    {
      name: 'name',
      label: '相册名称',
      type: 'text',
      placeholder: '请输入相册名称',
      required: true,
      validation: {
        minLength: 1,
        maxLength: 50,
      },
    },
    {
      name: 'description',
      label: '相册描述',
      type: 'textarea',
      placeholder: '请输入相册描述（可选）',
      rows: 3,
      validation: {
        maxLength: 200,
      },
    },
  ],
  submitText: '创建相册',
};

// 使用示例的Hook
export function useConfigurableFormDialog() {
  const [isOpen, setIsOpen] = useState(false);
  
  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);
  
  return {
    isOpen,
    openDialog,
    closeDialog,
  };
}