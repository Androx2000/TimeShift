import { useState } from 'react';
import { createFallbackAvatarDataUri, getAvatarUrl } from '../services/externalApi';

// Employee avatar from DiceBear; falls back to an initials SVG if it cannot load.
export default function Avatar({ name, size = 36 }) {
  const [failed, setFailed] = useState(false);

  return (
    <img
      src={failed ? createFallbackAvatarDataUri(name) : getAvatarUrl(name)}
      alt=""
      width={size}
      height={size}
      className="rounded-full shrink-0"
      onError={() => setFailed(true)}
    />
  );
}