import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Delete as DeleteIcon, OpenWith as MoveIcon, PhotoSizeSelectSmall as ResizeIcon } from '@mui/icons-material';

export interface EmbeddedImage {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  images: EmbeddedImage[];
  onChange: (images: EmbeddedImage[]) => void;
}

const MIN_SIZE = 40;

const EmbeddedImageLayer: React.FC<Props> = ({ images, onChange }) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const dragRef = React.useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    type: 'drag' | 'resize';
  } | null>(null);

  const updateImage = React.useCallback((id: string, patch: Partial<EmbeddedImage>) => {
    onChange(images.map(img => (img.id === id ? { ...img, ...patch } : img)));
  }, [images, onChange]);

  const deleteImage = (id: string) => {
    onChange(images.filter(img => img.id !== id));
  };

  const startInteraction = (e: React.MouseEvent, id: string, type: 'drag' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    const img = images.find(i => i.id === id);
    if (!img) return;
    setActiveId(id);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: img.x,
      origY: img.y,
      origW: img.width,
      origH: img.height,
      type,
    };
  };

  React.useEffect(() => {
    if (!activeId) return;
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (dragRef.current.type === 'drag') {
        updateImage(activeId, {
          x: Math.max(0, dragRef.current.origX + dx),
          y: Math.max(0, dragRef.current.origY + dy),
        });
      } else {
        updateImage(activeId, {
          width: Math.max(MIN_SIZE, dragRef.current.origW + dx),
          height: Math.max(MIN_SIZE, dragRef.current.origH + dy),
        });
      }
    };
    const onUp = () => {
      setActiveId(null);
      dragRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [activeId, updateImage]);

  if (images.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        overflow: 'hidden',
        borderRadius: 'inherit',
      }}
    >
      {images.map(img => {
        const isActive = activeId === img.id;
        const isHovered = hoveredId === img.id;
        const showControls = isActive || isHovered;

        return (
          <Box
            key={img.id}
            onMouseEnter={() => setHoveredId(img.id)}
            onMouseLeave={() => { if (!isActive) setHoveredId(null); }}
            sx={{
              position: 'absolute',
              left: img.x,
              top: img.y,
              width: img.width,
              height: img.height,
              pointerEvents: 'auto',
              border: '2px solid',
              borderColor: showControls ? 'primary.main' : 'transparent',
              borderRadius: 1,
              userSelect: 'none',
              transition: 'border-color 0.15s',
              boxSizing: 'border-box',
            }}
          >
            <Box
              component="img"
              src={img.src}
              draggable={false}
              onMouseDown={(e: React.MouseEvent) => startInteraction(e, img.id, 'drag')}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                cursor: isActive ? 'grabbing' : 'grab',
                borderRadius: 0.5,
              }}
            />

            {showControls && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -38,
                  left: 0,
                  display: 'flex',
                  gap: 0.25,
                  bgcolor: 'background.paper',
                  borderRadius: 1.5,
                  boxShadow: 3,
                  p: 0.5,
                  zIndex: 20,
                }}
              >
                <Tooltip title="Drag to move" placement="top">
                  <IconButton
                    size="small"
                    onMouseDown={(e: React.MouseEvent) => startInteraction(e, img.id, 'drag')}
                    sx={{ cursor: 'grab', p: 0.5 }}
                  >
                    <MoveIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete image" placement="top">
                  <IconButton
                    size="small"
                    onClick={() => deleteImage(img.id)}
                    color="error"
                    sx={{ p: 0.5 }}
                  >
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            <Tooltip title="Drag to resize" placement="bottom-end">
              <Box
                onMouseDown={(e: React.MouseEvent) => startInteraction(e, img.id, 'resize')}
                sx={{
                  position: 'absolute',
                  bottom: -6,
                  right: -6,
                  width: 14,
                  height: 14,
                  bgcolor: 'primary.main',
                  border: '2px solid',
                  borderColor: 'background.paper',
                  borderRadius: '3px',
                  cursor: 'se-resize',
                  opacity: showControls ? 1 : 0,
                  transition: 'opacity 0.15s',
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ResizeIcon sx={{ fontSize: 8, color: 'background.paper' }} />
              </Box>
            </Tooltip>
          </Box>
        );
      })}
    </Box>
  );
};

export default EmbeddedImageLayer;
