import React from 'react';

export interface ParticleAvatarParamMeta<ParamKey extends string> {
  key: ParamKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

export interface ParticleAvatarDebugPanelProps<ParamKey extends string> {
  params: Record<ParamKey, number>;
  meta: ParticleAvatarParamMeta<ParamKey>[];
  onChange: (key: ParamKey, value: number) => void;
  onReset: () => void;
}

export function ParticleAvatarDebugPanel<ParamKey extends string>({
  params,
  meta,
  onChange,
  onReset,
}: ParticleAvatarDebugPanelProps<ParamKey>) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute right-2 top-2 rounded border border-current px-1.5 py-0.5 text-xs opacity-40 hover:opacity-100"
      >
        粒子调参
      </button>
      {open && (
        <div className="absolute left-2 top-2 z-10 max-h-[calc(100%-0.5rem)] w-56 overflow-y-auto rounded-md border border-current/20 bg-background/90 p-3 text-xs shadow-lg backdrop-blur">
          {meta.map(({ key, label, min, max, step }) => (
            <label key={key} className="mb-2 block">
              <span className="flex justify-between">
                <span>{label}</span>
                <span>{params[key]}</span>
              </span>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={params[key]}
                onChange={(event) => onChange(key, Number(event.target.value))}
                className="w-full"
              />
            </label>
          ))}
          <button
            type="button"
            onClick={onReset}
            className="w-full rounded border border-current px-2 py-1"
          >
            重置
          </button>
        </div>
      )}
    </>
  );
}
