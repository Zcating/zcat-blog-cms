interface ImageUploadProps {
  name: string;
  value?: File | null;
  onChangeField?: (name: string, file: File) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export function ImageUpload(props: ImageUploadProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    props.onChangeField?.(props.name, file);
  };
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">Pick a file</legend>
      <input
        type="file"
        className="file-input"
        name={props.name}
        onChange={handleChange}
        onBlur={props.onBlur}
      />
      <label className="label">Max size 2MB</label>
    </fieldset>
  );
}
