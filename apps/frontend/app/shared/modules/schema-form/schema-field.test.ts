import { describe, it, expect } from 'vitest';

import {
  createSelect,
  createInput,
  createTextArea,
  createImageUpload,
  createCheckbox,
  createConstNumber,
  createConstString,
} from './schema-field';

describe('schema field factories', () => {
  describe('createSelect', () => {
    it('应该创建 select 字段', () => {
      const field = createSelect('选择分类', [{ label: 'A', value: 'a' }]);
      expect(field).toEqual({
        label: '选择分类',
        options: [{ label: 'A', value: 'a' }],
        type: 'select',
        valueType: 'string',
      });
    });
  });

  describe('createInput', () => {
    it('应该创建 input 字段', () => {
      const field = createInput('用户名', '请输入用户名');
      expect(field).toEqual({
        label: '用户名',
        placeholder: '请输入用户名',
        type: 'input',
        valueType: 'string',
      });
    });

    it('应该创建不带 placeholder 的 input 字段', () => {
      const field = createInput('用户名');
      expect(field.placeholder).toBeUndefined();
    });
  });

  describe('createTextArea', () => {
    it('应该创建 textarea 字段', () => {
      const field = createTextArea('描述', '请输入描述');
      expect(field).toEqual({
        label: '描述',
        placeholder: '请输入描述',
        type: 'textarea',
        valueType: 'string',
      });
    });
  });

  describe('createImageUpload', () => {
    it('应该创建 imageUpload 字段', () => {
      const field = createImageUpload('头像');
      expect(field).toEqual({
        label: '头像',
        type: 'imageUpload',
        valueType: 'file',
      });
    });
  });

  describe('createCheckbox', () => {
    it('应该创建 checkbox 字段', () => {
      const field = createCheckbox('是否公开');
      expect(field).toEqual({
        label: '是否公开',
        type: 'checkbox',
        valueType: 'boolean',
      });
    });
  });

  describe('createConstNumber', () => {
    it('应该创建常量数字字段', () => {
      const field = createConstNumber();
      expect(field).toEqual({
        label: '',
        type: 'constant',
        valueType: 'number',
      });
    });
  });

  describe('createConstString', () => {
    it('应该创建常量字符串字段', () => {
      const field = createConstString();
      expect(field).toEqual({
        label: '',
        type: 'constant',
        valueType: 'string',
      });
    });
  });
});
