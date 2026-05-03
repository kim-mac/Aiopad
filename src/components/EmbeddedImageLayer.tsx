import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Delete as DeleteIcon, OpenWith as MoveIcon } from '@mui/icons-material';

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

const MIN_SIZE = 60;

const EmbeddedImageLayer: React.FC<Props> = ({ images, onChange }) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const leaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const handleMouseEnter = (id: string) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHoveredId(id);
  };

  const handleMouseLeave = (id: string) => {
    leaveTimer.current = setTimeout(() => {
      setHoveredId(prev => (prev === id ? null : prev));
    }, 120);
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

  React.useEffect(() => () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  }, []);

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
            onMouseEnter={() => handleMouseEnter(img.id)}
            onMouseLeave={() => handleMouseLeave(img.id)}
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
              overflow: 'hidden',
            }}
          >
            {/* Image itself — drag to move */}
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
              }}
            />

            {/* Toolbar overlay — pinned to top-left INSIDE the image */}
            <Box
              sx={{
                position: 'absolute',
                top: 6,
                left: 6,
                display: 'flex',
                gap: 0.25,
                bgcolor: 'rgba(0,0,0,0.55)',
                borderRadius: 1.5,
                p: 0.25,
                opacity: showControls ? 1 : 0,
                transition: 'opacity 0.15s',
                pointerEvents: showControls ? 'auto' : 'none',
                zIndex: 2,
              }}
            >
              <Tooltip title="Drag to move" placement="bottom">
                <IconButton
                  size="small"
                  onMouseDown={(e: React.MouseEvent) => startInteraction(e, img.id, 'drag')}
                  sx={{ cursor: 'grab', p: 0.5, color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
                >
                  <MoveIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete image" placement="bottom">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}
                  sx={{ p: 0.5, color: '#ff6b6b', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Resize handle — bottom-right corner INSIDE the image */}
            <Box
              onMouseDown={(e: React.MouseEvent) => startInteraction(e, img.id, 'resize')}
              sx={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 16,
                height: 16,
                bgcolor: 'rgba(0,0,0,0.55)',
                border: '1.5px solid rgba(255,255,255,0.6)',
                borderRadius: '4px',
                cursor: 'se-resize',
                opacity: showControls ? 1 : 0,
                transition: 'opacity 0.15s',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box sx={{
                width: 6,
                height: 6,
                borderRight: '2px solid rgba(255,255,255,0.8)',
                borderBottom: '2px solid rgba(255,255,255,0.8)',
              }} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default EmbeddedImageLayer;
