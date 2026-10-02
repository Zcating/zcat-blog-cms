import { ZImageUpload } from '@zcat/ui';
import React from 'react';

export default function Settings() {
  const [imageUrl, setImageUrl] = React.useState<string>('');

  React.useEffect(() => {
    if (!imageUrl) {
      return;
    }
    fetch(imageUrl).then(console.log);
    return () => {
      URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  return <ZImageUpload value={imageUrl} onChange={setImageUrl} />;
}
