import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ZImageUpload } from './z-image-upload';

const BLOB_URL = 'blob:zcat-mock-url';

let originalCreateObjectURL: typeof URL.createObjectURL;

function createFile(name = 'photo.png', type = 'image/png') {
  return new File(['mock'], name, { type });
}

function ControlledHarness(props: {
  onChange: (url: string) => void;
  initialUrl?: string;
}) {
  const [url, setUrl] = React.useState(props.initialUrl ?? '');

  return (
    <>
      <ZImageUpload
        value={url}
        onChange={(next) => {
          props.onChange(next);
          setUrl(next);
        }}
      />
      <output data-testid="controlled-url">{url}</output>
    </>
  );
}

beforeEach(() => {
  originalCreateObjectURL = URL.createObjectURL;
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    writable: true,
    value: vi.fn(() => BLOB_URL),
  });
});

afterEach(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    writable: true,
    value: originalCreateObjectURL,
  });
});

describe('ZImageUpload onChange 派发次数', () => {
  it('非受控：选中一张图片后 onChange 只被调用一次', async () => {
    const onChange = vi.fn();
    const { container } = render(<ZImageUpload onChange={onChange} />);

    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    await userEvent.upload(input as HTMLInputElement, createFile());

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(BLOB_URL);
    expect(container.querySelector('img')).toHaveAttribute('src', BLOB_URL);
  });

  it('受控：选中一张图片后 onChange 只被调用一次', async () => {
    const onChange = vi.fn();
    const { container } = render(<ControlledHarness onChange={onChange} />);

    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    await userEvent.upload(input as HTMLInputElement, createFile());

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(BLOB_URL);
    expect(screen.getByTestId('controlled-url')).toHaveTextContent(BLOB_URL);
  });
});

const REMOVE_LABEL = '移除图片';

function queryRemove() {
  return screen.queryByRole('button', { name: REMOVE_LABEL });
}

function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

describe('ZImageUpload 移除图片', () => {
  it('空状态不渲染移除按钮', () => {
    render(<ZImageUpload onChange={vi.fn()} />);

    expect(queryRemove()).not.toBeInTheDocument();
  });

  it('有值时渲染移除按钮，是真实的 button', async () => {
    const { container } = render(<ZImageUpload onChange={vi.fn()} />);

    await userEvent.upload(getFileInput(container), createFile());

    const remove = queryRemove();
    expect(remove).toBeInTheDocument();
    expect(remove).toHaveAttribute('type', 'button');
    expect(remove).toHaveAttribute('aria-label', REMOVE_LABEL);
  });

  it('非受控：点击移除只回调一次 onChange("") 并回到空状态', async () => {
    const onChange = vi.fn();
    const { container } = render(<ZImageUpload onChange={onChange} />);

    await userEvent.upload(getFileInput(container), createFile());
    expect(onChange).toHaveBeenCalledTimes(1);

    await userEvent.click(queryRemove() as HTMLElement);

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('受控：点击移除只回调一次 onChange("") 并清空受控值', async () => {
    const onChange = vi.fn();
    const { container } = render(<ControlledHarness onChange={onChange} />);

    await userEvent.upload(getFileInput(container), createFile());
    expect(onChange).toHaveBeenCalledTimes(1);

    await userEvent.click(queryRemove() as HTMLElement);

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(screen.getByTestId('controlled-url')).toHaveTextContent('');
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('点击移除不会打开文件选择器', async () => {
    const { container } = render(<ZImageUpload onChange={vi.fn()} />);
    const input = getFileInput(container);
    await userEvent.upload(input, createFile());

    const inputClick = vi.spyOn(input, 'click');
    await userEvent.click(queryRemove() as HTMLElement);

    expect(inputClick).not.toHaveBeenCalled();
    inputClick.mockRestore();
  });

  it('键盘 Enter 移除只回调一次且不打开文件选择器', async () => {
    const onChange = vi.fn();
    const { container } = render(<ZImageUpload onChange={onChange} />);
    const input = getFileInput(container);
    await userEvent.upload(input, createFile());

    const inputClick = vi.spyOn(input, 'click');
    const remove = queryRemove() as HTMLElement;
    remove.focus();
    expect(remove).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(inputClick).not.toHaveBeenCalled();
    inputClick.mockRestore();
  });

  it('键盘 Space 移除只回调一次且不打开文件选择器', async () => {
    const onChange = vi.fn();
    const { container } = render(<ZImageUpload onChange={onChange} />);
    const input = getFileInput(container);
    await userEvent.upload(input, createFile());

    const inputClick = vi.spyOn(input, 'click');
    (queryRemove() as HTMLElement).focus();
    await userEvent.keyboard(' ');

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(inputClick).not.toHaveBeenCalled();
    inputClick.mockRestore();
  });

  it('disabled 时移除按钮不可用，清空不会发生', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <ZImageUpload value={BLOB_URL} onChange={onChange} disabled />,
    );

    const inputClick = vi.spyOn(getFileInput(container), 'click');
    const remove = queryRemove() as HTMLButtonElement;
    expect(remove).toBeInTheDocument();
    expect(remove).toBeDisabled();

    await userEvent.click(remove);

    expect(onChange).not.toHaveBeenCalled();
    expect(inputClick).not.toHaveBeenCalled();
    inputClick.mockRestore();
  });
});

const OBJECT_KEY = 'user/1791344177028-3655128.png';
const HTTPS_URL = 'https://example.com/photo.png';

describe('ZImageUpload 预览源可渲染性', () => {
  it('裸对象 key 渲染占位图标，不发起图片请求', () => {
    const { container } = render(
      <ZImageUpload value={OBJECT_KEY} onChange={vi.fn()} />,
    );

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(queryRemove()).toBeInTheDocument();
  });

  it('blob: 值仍然渲染预览', () => {
    const { container } = render(
      <ZImageUpload value={BLOB_URL} onChange={vi.fn()} />,
    );

    expect(container.querySelector('img')).toHaveAttribute('src', BLOB_URL);
  });

  it('https: 值仍然渲染预览', () => {
    const { container } = render(
      <ZImageUpload value={HTTPS_URL} onChange={vi.fn()} />,
    );

    expect(container.querySelector('img')).toHaveAttribute('src', HTTPS_URL);
  });

  it('裸对象 key 时移除按钮仍然渲染并只回调一次 onChange("")', async () => {
    const onChange = vi.fn();
    render(<ZImageUpload value={OBJECT_KEY} onChange={onChange} />);

    const remove = queryRemove();
    expect(remove).toBeInTheDocument();
    await userEvent.click(remove as HTMLElement);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('值不可渲染时不触发 onChange，也不改写受控值', () => {
    const onChange = vi.fn();
    render(<ControlledHarness onChange={onChange} initialUrl={OBJECT_KEY} />);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('controlled-url')).toHaveTextContent(OBJECT_KEY);
  });

  it('disabled 时裸对象 key 的移除按钮仍然不可用', async () => {
    const onChange = vi.fn();
    render(<ZImageUpload value={OBJECT_KEY} onChange={onChange} disabled />);

    const remove = queryRemove() as HTMLButtonElement;
    expect(remove).toBeInTheDocument();
    expect(remove).toBeDisabled();

    await userEvent.click(remove);

    expect(onChange).not.toHaveBeenCalled();
  });
});
