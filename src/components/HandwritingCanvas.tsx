import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Clear as ClearIcon,
  TextFields as TextIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { createWorker } from 'tesseract.js';

interface HandwritingCanvasProps {
  onTextConverted: (text: string) => void;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  showStrokeControls?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

const HandwritingCanvas: React.FC<HandwritingCanvasProps> = ({
  onTextConverted,
  strokeColor = '#000000',
  strokeWidth = 3,
  backgroundColor = '#ffffff',
  showStrokeControls = true,
  className,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(strokeWidth);
  const [currentStrokeColor, setCurrentStrokeColor] = useState(strokeColor);
  const [ocrProgress, setOcrProgress] = useState<string>('');
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Predefined colors
  const predefinedColors = [
    '#000000', // Black
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#008000', // Dark Green
    '#FFC0CB', // Pink
    '#A52A2A', // Brown
  ];

  // ResizeObserver to make canvas fill parent
  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    resize();
    const observer = new (window as any).ResizeObserver(resize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Click outside handler for color picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColorPicker && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  // Initialize and redraw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [strokes, backgroundColor, canvasSize]);

  const getCanvasPoint = useCallback((event: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in event) {
      // Touch event
      if (event.touches.length === 0) return null;
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      // Mouse event
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const point = getCanvasPoint(event);
    if (!point) return;

    setIsDrawing(true);
    const newStroke: Stroke = {
      points: [point],
      color: currentStrokeColor,
      width: currentStrokeWidth,
    };
    setCurrentStroke(newStroke);
  }, [getCanvasPoint, currentStrokeColor, currentStrokeWidth]);

  const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke) return;

    const point = getCanvasPoint(event);
    if (!point) return;

    setCurrentStroke(prev => prev ? {
      ...prev,
      points: [...prev.points, point],
    } : null);
  }, [isDrawing, currentStroke, getCanvasPoint]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing || !currentStroke) return;

    setIsDrawing(false);
    
    // Save current state for undo
    setUndoStack(prev => [...prev, [...strokes]]);
    setRedoStack([]); // Clear redo stack when new stroke is added

    // Add current stroke to strokes array
    setStrokes(prev => [...prev, currentStroke]);
    setCurrentStroke(null);
  }, [isDrawing, currentStroke, strokes]);

  const clearCanvas = useCallback(() => {
    setUndoStack(prev => [...prev, [...strokes]]);
    setRedoStack([]);
    setStrokes([]);
    setCurrentStroke(null);
  }, [strokes]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const previousStrokes = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, [...strokes]]);
    setStrokes(previousStrokes);
    setUndoStack(prev => prev.slice(0, -1));
  }, [undoStack, strokes]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const nextStrokes = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, [...strokes]]);
    setStrokes(nextStrokes);
    setRedoStack(prev => prev.slice(0, -1));
  }, [redoStack, strokes]);

  const convertToText = useCallback(async () => {
    if (strokes.length === 0) {
      setError('No handwriting to convert');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');

      // Create a temporary canvas to process the image
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('Failed to get canvas context');

      // Set temp canvas size
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;

      // Fill with white background
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Draw the handwriting strokes
      strokes.forEach(stroke => {
        if (stroke.points.length < 2) return;

        tempCtx.strokeStyle = '#000000'; // Convert to black for better OCR
        tempCtx.lineWidth = stroke.width;
        tempCtx.lineCap = 'round';
        tempCtx.lineJoin = 'round';
        tempCtx.beginPath();
        tempCtx.moveTo(stroke.points[0].x, stroke.points[0].y);

        for (let i = 1; i < stroke.points.length; i++) {
          tempCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }

        tempCtx.stroke();
      });

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        tempCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert canvas to blob'));
        }, 'image/png');
      });

      // Use Tesseract.js for OCR
      const worker = await createWorker('eng', 1, {
        logger: m => {
          console.log(m);
          if (m.status === 'recognizing text') {
            setOcrProgress(`Recognizing text... ${Math.round(m.progress * 100)}%`);
          } else if (m.status === 'loading tesseract core') {
            setOcrProgress('Loading OCR engine...');
          } else if (m.status === 'loading language traineddata') {
            setOcrProgress('Loading language data...');
          } else if (m.status === 'initializing tesseract') {
            setOcrProgress('Initializing...');
          }
        }
      });

      // Perform OCR
      const { data: { text } } = await worker.recognize(blob);
      
      // Terminate the worker
      await worker.terminate();

      // Clean up the recognized text
      const cleanedText = text.trim();
      
      if (!cleanedText) {
        setError('No text could be recognized from the handwriting');
        return;
      }

      onTextConverted(cleanedText);
      
      // Clear canvas after successful conversion
      clearCanvas();
      
    } catch (err) {
      console.error('OCR Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to convert handwriting to text');
    } finally {
      setIsConverting(false);
      setOcrProgress('');
    }
  }, [strokes, onTextConverted, clearCanvas]);

  // Handle mouse events
  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    startDrawing(event);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    event.preventDefault();
    draw(event);
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    event.preventDefault();
    stopDrawing();
  };

  const handleMouseLeave = (event: React.MouseEvent) => {
    event.preventDefault();
    stopDrawing();
  };

  // Handle touch events
  const handleTouchStart = (event: React.TouchEvent) => {
    event.preventDefault();
    startDrawing(event);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    event.preventDefault();
    draw(event);
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    event.preventDefault();
    stopDrawing();
  };

  return (
    <Box
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1, minHeight: 0, minWidth: 0 }}
    >
      <Paper
        elevation={3}
        sx={{
          border: '2px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          width: '100%',
          height: '100%',
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Clear Canvas">
            <IconButton onClick={clearCanvas} size="small">
              <ClearIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Undo">
            <IconButton onClick={undo} disabled={undoStack.length === 0} size="small">
              <UndoIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Redo">
            <IconButton onClick={redo} disabled={redoStack.length === 0} size="small">
              <RedoIcon />
            </IconButton>
          </Tooltip>
          
          {showStrokeControls && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 'fit-content' }}>
                  Stroke:
                </Typography>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentStrokeWidth}
                  onChange={(e) => setCurrentStrokeWidth(Number(e.target.value))}
                  style={{
                    width: '60px',
                    cursor: 'pointer',
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: '16px', textAlign: 'center' }}>
                  {currentStrokeWidth}
                </Typography>
              </Box>
              
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 'fit-content' }}>
                  Color:
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <Tooltip title="Select color">
                    <IconButton
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      size="small"
                      sx={{
                        width: 28,
                        height: 28,
                        border: '2px solid',
                        borderColor: 'divider',
                        backgroundColor: currentStrokeColor,
                        borderRadius: 1,
                        '&:hover': {
                          backgroundColor: currentStrokeColor,
                          opacity: 0.8,
                          borderColor: 'primary.main',
                        },
                      }}
                    />
                  </Tooltip>
                  
                  {showColorPicker && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        zIndex: 1000,
                        backgroundColor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(6, 1fr)',
                        gap: 0.5,
                        boxShadow: 3,
                        minWidth: '180px',
                      }}
                    >
                      {predefinedColors.map((color) => (
                        <Tooltip key={color} title={color}>
                          <Box
                            onClick={() => {
                              setCurrentStrokeColor(color);
                              setShowColorPicker(false);
                            }}
                            sx={{
                              width: 20,
                              height: 20,
                              backgroundColor: color,
                              border: '1px solid',
                              borderColor: currentStrokeColor === color ? 'primary.main' : 'divider',
                              borderRadius: 0.5,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                borderColor: 'primary.main',
                                transform: 'scale(1.1)',
                              },
                            }}
                          />
                        </Tooltip>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </>
          )}
          
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Convert to Text">
            <IconButton 
              onClick={convertToText} 
              disabled={strokes.length === 0 || isConverting}
              size="small"
              color="primary"
            >
              {isConverting ? <CircularProgress size={20} /> : <TextIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        
        <canvas
          ref={canvasRef}
          style={{
            cursor: 'crosshair',
            touchAction: 'none',
            width: '100%',
            height: '100%',
            display: 'block',
            flex: 1,
            background: backgroundColor,
          }}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </Paper>

      <Typography variant="body2" color="text.secondary" textAlign="center">
        Draw or write with your finger, stylus, or mouse. Click the text icon to convert to text.
      </Typography>
      
      {isConverting && ocrProgress && (
        <Typography variant="body2" color="primary" textAlign="center">
          {ocrProgress}
        </Typography>
      )}

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HandwritingCanvas; 