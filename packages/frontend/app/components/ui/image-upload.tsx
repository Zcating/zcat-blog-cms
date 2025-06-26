interface ImageUploadProps {
  onUpload: (file: File) => Promise<string>;
}

export function ImageUpload(props: ImageUploadProps) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">Pick a file</legend>
      <input type="file" className="file-input" />
      <label className="label">Max size 2MB</label>
    </fieldset>
  );
}
