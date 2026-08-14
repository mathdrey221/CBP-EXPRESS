import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCode({ value, size = 160, className }: { value: string; size?: number; className?: string }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { width: size * 2, margin: 1, color: { dark: "#0057B8", light: "#FFFFFF" } })
      .then((url) => {
        if (alive) setSrc(url);
      })
      .catch(() => setSrc(""));
    return () => {
      alive = false;
    };
  }, [value, size]);

  if (!src) return <div className="rounded-lg bg-muted" style={{ width: size, height: size }} />;
  return <img src={src} width={size} height={size} alt={`QR code ${value}`} className={className} />;
}
