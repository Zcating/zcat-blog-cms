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

function ControlledHarness(props: { onChange: (url: string) => void }) {
  const [url, setUrl] = React.useState('');

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
