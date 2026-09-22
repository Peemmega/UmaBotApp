import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const CROP_SIZE = 320;
const OUTPUT_SIZE = 512;

export default function ProfileImageCropModal({ file, onCancel, onConfirm }) {
  const imageRef = useRef(null);
  const dragRef = useRef(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [imageSize, setImageSize] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = imageSize ? Math.max(CROP_SIZE / imageSize.width, CROP_SIZE / imageSize.height) : 1;
  const displayWidth = imageSize ? imageSize.width * baseScale * zoom : CROP_SIZE;
  const displayHeight = imageSize ? imageSize.height * baseScale * zoom : CROP_SIZE;
  const clampPosition = (next) => ({
    x: Math.min(0, Math.max(CROP_SIZE - displayWidth, next.x)),
    y: Math.min(0, Math.max(CROP_SIZE - displayHeight, next.y)),
  });

  const handleLoad = (event) => {
    const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
    setImageSize({ width, height });
    const scale = Math.max(CROP_SIZE / width, CROP_SIZE / height);
    setPosition({ x: (CROP_SIZE - width * scale) / 2, y: (CROP_SIZE - height * scale) / 2 });
  };

  const handlePointerDown = (event) => {
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, position };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPosition(clampPosition({ x: drag.position.x + event.clientX - drag.x, y: drag.position.y + event.clientY - drag.y }));
  };
  const handlePointerUp = () => { dragRef.current = null; };
  const handleZoom = (event) => {
    const nextZoom = Number(event.target.value);
    const oldWidth = displayWidth;
    const oldHeight = displayHeight;
    const nextWidth = imageSize.width * baseScale * nextZoom;
    const nextHeight = imageSize.height * baseScale * nextZoom;
    setZoom(nextZoom);
    setPosition({
      x: Math.min(0, Math.max(CROP_SIZE - nextWidth, position.x - (nextWidth - oldWidth) / 2)),
      y: Math.min(0, Math.max(CROP_SIZE - nextHeight, position.y - (nextHeight - oldHeight) / 2)),
    });
  };
  const saveCrop = () => {
    if (!imageRef.current || !imageSize) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const context = canvas.getContext("2d");
    context.drawImage(imageRef.current, position.x * OUTPUT_SIZE / CROP_SIZE, position.y * OUTPUT_SIZE / CROP_SIZE, displayWidth * OUTPUT_SIZE / CROP_SIZE, displayHeight * OUTPUT_SIZE / CROP_SIZE);
    canvas.toBlob((blob) => {
      if (blob) onConfirm(new File([blob], "profile.webp", { type: "image/webp" }));
    }, "image/webp", 0.9);
  };

  return createPortal(
    <div className="profile-crop-backdrop" onMouseDown={onCancel}>
      <section className="profile-crop-modal" role="dialog" aria-modal="true" aria-labelledby="profile-crop-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span>Profile image</span><h2 id="profile-crop-title">Crop image 1:1</h2></div><button type="button" onClick={onCancel} aria-label="Close">×</button></header>
        <p>ลากรูปเพื่อจัดตำแหน่ง และปรับการซูมก่อนบันทึก</p>
        <div className="profile-crop-viewport" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
          <img ref={imageRef} src={sourceUrl} alt="Crop preview" onLoad={handleLoad} draggable="false" style={{ width: displayWidth, height: displayHeight, left: position.x, top: position.y }} />
        </div>
        <label className="profile-crop-zoom">Zoom<input type="range" min="1" max="3" step="0.01" value={zoom} onChange={handleZoom} /></label>
        <footer><button type="button" className="profile-crop-cancel" onClick={onCancel}>Cancel</button><button type="button" className="profile-crop-save" onClick={saveCrop} disabled={!imageSize}>Use this image</button></footer>
      </section>
    </div>,
    document.body
  );
}
