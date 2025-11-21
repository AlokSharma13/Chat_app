import { useState, useEffect } from 'react';
import { X, Download, Trash2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

const ImageModal = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  fileName = "image.jpg",
  onDelete,
  canDelete = false 
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center image-modal-backdrop"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <X size={24} />
      </button>

      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={handleRotate}
          className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <RotateCw size={20} />
        </button>
        <button
          onClick={handleReset}
          className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <div className="text-xs font-bold">1:1</div>
        </button>
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 text-white transition-colors"
        >
          <Download size={16} />
          Download
        </button>
        {canDelete && (
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 text-white transition-colors"
          >
            <Trash2 size={16} />
            Delete
          </button>
        )}
      </div>

      {/* Image container */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] overflow-hidden cursor-move image-modal-content"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={fileName}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
            transformOrigin: 'center'
          }}
          draggable={false}
        />
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-4 right-4 z-10 text-white text-sm bg-black/50 px-2 py-1 rounded">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
};

export default ImageModal;
