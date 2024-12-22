import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper,
  ThemeProvider,
  createTheme,
  TextField,
  Stack,
  useMediaQuery,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h3: {
      fontSize: '2.5rem',
      '@media (max-width:600px)': {
        fontSize: '2rem',
      },
    },
    h4: {
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h6: {
      '@media (max-width:600px)': {
        fontSize: '0.9rem',
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

interface BingoTile {
  id: number;
  selected: boolean;
  highlighted: boolean;
  value: string;
  stickerUrl: string;
  gridPosition: {
    row: number;
    col: number;
  };
  isWinningTile?: boolean;
  isAnimating?: boolean;
}

interface SavedGame {
  tiles: BingoTile[];
  columnHeaders: string[];
  rowHeaders: string[];
  bingo: boolean;
  timestamp: number;
}

// Function to get an AI-generated sticker image
const generateAIImage = async () => {
  const subjects = [
    // Cozy Home Elements
    'tiny cottage with thatched roof',
    'cozy window seat with cushions',
    'steaming teacup with flowers',
    'vintage teapot with roses',
    'woven basket with mushrooms',
    'rustic wooden door with ivy',
    'antique lantern with candle',
    'stack of vintage books',
    
    // Garden & Nature
    'cottage garden flowers',
    'wild strawberry patch',
    'climbing morning glories',
    'garden gate with roses',
    'herb garden with labels',
    'woven flower crown',
    'pressed flower collection',
    'wildflower bouquet',
    
    // Cozy Activities
    'knitting basket with yarn',
    'open journal with pressed flowers',
    'baking bread scene',
    'jam making setup',
    'herb drying rack',
    'letter writing desk',
    'embroidery hoop with flowers',
    
    // Whimsical Elements
    'fairy mushroom house',
    'garden gnome home',
    'butterfly collection',
    'pressed leaf art',
    'acorn and flower wreath',
    'dried flower garland',
    'moss covered stepping stones',
    
    // Kitchen & Food
    'fresh baked pie cooling',
    'honey jar with flowers',
    'herbal tea collection',
    'basket of fresh eggs',
    'homemade jam jars',
    'fresh baked cookies',
    'dried herb bundles',
    
    // Seasonal Elements
    'autumn leaf collection',
    'spring flower basket',
    'winter window scene',
    'summer garden harvest',
    'dried lavender bunch',
    'seasonal berry basket',
    'pressed autumn leaves'
  ];

  const styles = [
    'cottagecore illustration',
    'cozy hand drawn art',
    'whimsical illustration',
    'vintage botanical style'
  ];

  const details = [
    'soft watercolor style',
    'delicate line art',
    'hand drawn details',
    'vintage illustration style',
    'gentle ink drawing',
    'botanical sketch style'
  ];

  const extras = [
    'muted earth tones',
    'vintage color palette',
    'delicate shading',
    'soft textures',
    'gentle linework',
    'romantic details',
    'cozy atmosphere',
    'nostalgic feeling'
  ];

  const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const randomDetail = details[Math.floor(Math.random() * details.length)];
  const randomExtra = extras[Math.floor(Math.random() * extras.length)];
  
  const prompt = `${randomSubject}, ${randomStyle}, ${randomDetail}, ${randomExtra}, pure white background, single illustration, hand drawn art style, clean edges, no text, centered composition, cottagecore aesthetic, solid white background, isolated artwork, not photorealistic, illustrated style`;
  const seed = Math.floor(Math.random() * 1000000);
  
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=512&height=512&nologo=true&style=cute&seed2=${seed + 1}`;
};

function App() {
  const [tiles, setTiles] = useState<BingoTile[]>([]);
  const [bingo, setBingo] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [columnHeaders, setColumnHeaders] = useState<string[]>(['B', 'I', 'N', 'G', 'O']);
  const [rowHeaders, setRowHeaders] = useState<string[]>(['100', '200', '300', '400', '500']);
  const [editingColumnIndex, setEditingColumnIndex] = useState<number | null>(null);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [newGameDialogOpen, setNewGameDialogOpen] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [activeGameTimestamp, setActiveGameTimestamp] = useState<number | null>(null);
  const [loadConfirmDialogOpen, setLoadConfirmDialogOpen] = useState(false);
  const [gameToLoad, setGameToLoad] = useState<SavedGame | null>(null);
  
  // Media queries for responsive design
  const isMobile = useMediaQuery('(max-width:600px)');
  const isTablet = useMediaQuery('(max-width:960px)');

  // Calculate container size based on screen width
  const getContainerSize = useCallback(() => {
    if (isMobile) return 'sm';
    if (isTablet) return 'md';
    return 'lg';
  }, [isMobile, isTablet]);

  // Update tile height calculation
  const getTileHeight = useCallback(() => {
    if (isMobile) return 90;
    if (isTablet) return 100;
    return 120;
  }, [isMobile, isTablet]);

  // Update tile width calculation
  const getTileWidth = useCallback(() => {
    if (isMobile) return 120;
    if (isTablet) return 140;
    return 160;
  }, [isMobile, isTablet]);

  // Get dynamic font size based on text length
  const getHeaderFontSize = (text: string) => {
    const length = text.length;
    if (length > 40) return '0.7rem';
    if (length > 30) return '0.8rem';
    if (length > 20) return '0.9rem';
    if (length > 10) return '1rem';
    return isMobile ? '1rem' : '1.25rem';
  };

  const initializeBoard = () => {
    setIsImageLoading(true);
    
    try {
      const initialTiles: BingoTile[] = Array.from({ length: 25 }, (_, index) => ({
        id: index,
        selected: false,
        highlighted: false,
        value: rowHeaders[Math.floor(index / 5)],
        stickerUrl: '', // Start with empty URLs
        gridPosition: {
          row: Math.floor(index / 5),
          col: index % 5
        }
      }));
      setTiles(initialTiles);
      setBingo(false);
    } catch (error) {
      console.error('Error initializing board:', error);
    } finally {
      setIsImageLoading(false);
    }
  };

  useEffect(() => {
    initializeBoard();
  }, []);

  // Load saved games and current game state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bingoSavedGames');
    if (saved) {
      setSavedGames(JSON.parse(saved));
    }

    const currentGame = localStorage.getItem('bingoCurrentGame');
    if (currentGame) {
      const gameState = JSON.parse(currentGame);
      setTiles(gameState.tiles);
      setColumnHeaders(gameState.columnHeaders);
      setRowHeaders(gameState.rowHeaders);
      setBingo(gameState.bingo);
      setActiveGameTimestamp(gameState.timestamp);
      setIsImageLoading(false);
    } else {
      initializeBoard();
    }
  }, []);

  // Save current game state to localStorage whenever it changes
  useEffect(() => {
    if (!isImageLoading) {
      const currentGame = {
        tiles,
        columnHeaders,
        rowHeaders,
        bingo,
        timestamp: activeGameTimestamp
      };
      localStorage.setItem('bingoCurrentGame', JSON.stringify(currentGame));
    }
  }, [tiles, columnHeaders, rowHeaders, bingo, activeGameTimestamp, isImageLoading]);

  const markWinningTiles = (newTiles: BingoTile[], winningTilesFn: (tile: BingoTile) => boolean) => {
    const winningTiles = newTiles.map(tile => 
      winningTilesFn(tile) ? { ...tile, isWinningTile: true, isAnimating: true } : tile
    );
    setTiles(winningTiles);

    // Stop animation after 3 seconds
    setTimeout(() => {
      setTiles(tiles => tiles.map(tile => 
        tile.isWinningTile ? { ...tile, isAnimating: false } : tile
      ));
    }, 3000);

    return true;
  };

  const checkBingo = (newTiles: BingoTile[]) => {
    // Check rows
    for (let i = 0; i < 5; i++) {
      const rowTiles = newTiles.slice(i * 5, (i + 1) * 5);
      if (rowTiles.every(tile => tile.selected)) {
        return markWinningTiles(newTiles, tile => tile.gridPosition.row === i);
      }
    }

    // Check columns
    for (let i = 0; i < 5; i++) {
      const columnTiles = newTiles.filter((_, index) => index % 5 === i);
      if (columnTiles.every(tile => tile.selected)) {
        return markWinningTiles(newTiles, tile => tile.gridPosition.col === i);
      }
    }

    // Check main diagonal
    if ([0, 6, 12, 18, 24].every(index => newTiles[index].selected)) {
      return markWinningTiles(newTiles, tile => tile.gridPosition.row === tile.gridPosition.col);
    }

    // Check anti-diagonal
    if ([4, 8, 12, 16, 20].every(index => newTiles[index].selected)) {
      return markWinningTiles(newTiles, tile => tile.gridPosition.row + tile.gridPosition.col === 4);
    }

    return false;
  };

  const startCooldown = () => {
    setCooldownActive(true);
    setCooldownTime(3);
    
    const timer = setInterval(() => {
      setCooldownTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setCooldownActive(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const flipRandomTile = async () => {
    if (cooldownActive) return;

    const unselectedTiles = tiles.filter(tile => !tile.highlighted && !tile.selected);
    if (unselectedTiles.length === 0) return;

    startCooldown();
    
    const randomTile = unselectedTiles[Math.floor(Math.random() * unselectedTiles.length)];
    const imageUrl = await generateAIImage();
    
    const newTiles = tiles.map(tile =>
      tile.id === randomTile.id ? { ...tile, highlighted: true, stickerUrl: imageUrl } : tile
    );

    setTiles(newTiles);
    if (!bingo && checkBingo(newTiles)) {
      setBingo(true);
    }
  };

  const handleTileClick = async (tileId: number) => {
    const clickedTile = tiles.find(tile => tile.id === tileId);
    if (!clickedTile || clickedTile.selected) return;

    if (clickedTile.highlighted) {
      // If the tile is highlighted but has no image (failed generation), try again
      if (!clickedTile.stickerUrl) {
        try {
          const imageUrl = await generateAIImage();
          const newTiles = tiles.map(tile =>
            tile.id === tileId ? { ...tile, stickerUrl: imageUrl } : tile
          );
          setTiles(newTiles);
        } catch (error) {
          console.error('Error retrying image generation:', error);
        }
        return;
      }

      const newTiles = tiles.map(tile => {
        if (tile.id === tileId) {
          return { ...tile, highlighted: false, selected: true };
        }
        return tile;
      });

      setTiles(newTiles);
      if (!bingo && checkBingo(newTiles)) {
        setBingo(true);
      }
    }
  };

  const handleColumnHeaderClick = (index: number) => {
    if (editMode) {
      setEditingColumnIndex(index);
    }
  };

  const handleColumnHeaderChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newHeaders = [...columnHeaders];
    newHeaders[index] = event.target.value;
    setColumnHeaders(newHeaders);
  };

  const handleColumnHeaderBlur = () => {
    setEditingColumnIndex(null);
  };

  const handleColumnHeaderKeyPress = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Enter') {
      setEditingColumnIndex(null);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      if (index === columnHeaders.length - 1) {
        // If we're at the last column, move to the first row
        setEditingColumnIndex(null);
        setEditingRowIndex(0);
      } else {
        // Move to next column
        setEditingColumnIndex(index + 1);
      }
    }
  };

  const handleRowHeaderClick = (index: number) => {
    if (editMode) {
      setEditingRowIndex(index);
    }
  };

  const handleRowHeaderChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newHeaders = [...rowHeaders];
    newHeaders[index] = event.target.value;
    setRowHeaders(newHeaders);
    
    // Update all tiles in the changed row
    const newTiles = tiles.map(tile => 
      tile.gridPosition.row === index 
        ? { ...tile, value: event.target.value }
        : tile
    );
    setTiles(newTiles);
  };

  const handleRowHeaderBlur = () => {
    setEditingRowIndex(null);
  };

  const handleRowHeaderKeyPress = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Enter') {
      setEditingRowIndex(null);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      if (index === rowHeaders.length - 1) {
        // If we're at the last row, move to the first column
        setEditingRowIndex(null);
        setEditingColumnIndex(0);
      } else {
        // Move to next row
        setEditingRowIndex(index + 1);
      }
    }
  };

  const handleResetCancel = () => {
    setResetDialogOpen(false);
  };

  const handleSaveGame = () => {
    const currentTimestamp = activeGameTimestamp || Date.now();
    const newSave: SavedGame = {
      tiles,
      columnHeaders,
      rowHeaders,
      bingo,
      timestamp: currentTimestamp
    };

    let updatedSaves: SavedGame[];
    if (activeGameTimestamp) {
      // Overwrite existing game
      updatedSaves = savedGames.map(game => 
        game.timestamp === activeGameTimestamp ? newSave : game
      );
    } else {
      // New game, but maintain 5 max limit
      const existingSaveIndex = savedGames.findIndex(game => game.timestamp === currentTimestamp);
      if (existingSaveIndex !== -1) {
        updatedSaves = savedGames.map((game, index) => 
          index === existingSaveIndex ? newSave : game
        );
      } else {
        updatedSaves = [...savedGames, newSave].slice(-5);
      }
      setActiveGameTimestamp(currentTimestamp);
    }

    setSavedGames(updatedSaves);
    localStorage.setItem('bingoSavedGames', JSON.stringify(updatedSaves));
    setSaveDialogOpen(false);
  };

  const handleLoadGame = (savedGame: SavedGame) => {
    setTiles(savedGame.tiles);
    setColumnHeaders(savedGame.columnHeaders);
    setRowHeaders(savedGame.rowHeaders);
    setBingo(savedGame.bingo);
    setActiveGameTimestamp(savedGame.timestamp);
    setLoadDialogOpen(false);
  };

  const handleNewGame = () => {
    // If there are any highlighted or selected tiles, show confirmation
    const hasProgress = tiles.some(tile => tile.highlighted || tile.selected);
    
    if (hasProgress) {
      setNewGameDialogOpen(true);
    } else if (savedGames.length >= 5) {
      setResetDialogOpen(true);
    } else {
      handleNewGameConfirm();
    }
  };

  const handleNewGameConfirm = async () => {
    setResetDialogOpen(false);
    setActiveGameTimestamp(null);
    const defaultColumnHeaders = ['B', 'I', 'N', 'G', 'O'];
    const defaultRowHeaders = ['100', '200', '300', '400', '500'];
    setColumnHeaders(defaultColumnHeaders);
    setRowHeaders(defaultRowHeaders);

    // Create new tiles with default row header values
    const initialTiles: BingoTile[] = Array.from({ length: 25 }, (_, index) => ({
      id: index,
      selected: false,
      highlighted: false,
      value: defaultRowHeaders[Math.floor(index / 5)],
      stickerUrl: '',
      gridPosition: {
        row: Math.floor(index / 5),
        col: index % 5
      }
    }));
    
    setTiles(initialTiles);
    setBingo(false);
    // Clear current game from localStorage when starting new game
    localStorage.removeItem('bingoCurrentGame');
  };

  const handleNewGameCancel = () => {
    setNewGameDialogOpen(false);
  };

  const handleDeleteSave = (timestamp: number) => {
    const updatedSaves = savedGames.filter(game => game.timestamp !== timestamp);
    setSavedGames(updatedSaves);
    localStorage.setItem('bingoSavedGames', JSON.stringify(updatedSaves));
    
    if (timestamp === activeGameTimestamp) {
      setActiveGameTimestamp(null);
      const defaultColumnHeaders = ['B', 'I', 'N', 'G', 'O'];
      const defaultRowHeaders = ['100', '200', '300', '400', '500'];
      setColumnHeaders(defaultColumnHeaders);
      setRowHeaders(defaultRowHeaders);

      // Create new tiles with default row header values
      const initialTiles: BingoTile[] = Array.from({ length: 25 }, (_, index) => ({
        id: index,
        selected: false,
        highlighted: false,
        value: defaultRowHeaders[Math.floor(index / 5)],
        stickerUrl: '',
        gridPosition: {
          row: Math.floor(index / 5),
          col: index % 5
        }
      }));
      
      setTiles(initialTiles);
      setBingo(false);
    }
  };

  const handleLoadGameClick = (game: SavedGame) => {
    // Check if current game has any progress
    const hasProgress = tiles.some(tile => tile.highlighted || tile.selected);
    
    if (hasProgress) {
      setGameToLoad(game);
      setLoadConfirmDialogOpen(true);
    } else {
      handleLoadGame(game);
    }
  };

  const handleLoadConfirm = async () => {
    if (!gameToLoad) return;
    
    setLoadConfirmDialogOpen(false);
    handleLoadGame(gameToLoad);
    setGameToLoad(null);
  };

  const handleSaveAndLoad = async () => {
    if (!gameToLoad) return;
    
    // Save current game first
    handleSaveGame();
    // Then load the new game
    handleLoadGame(gameToLoad);
    setLoadConfirmDialogOpen(false);
    setGameToLoad(null);
  };

  const handleLoadCancel = () => {
    setLoadConfirmDialogOpen(false);
    setGameToLoad(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container 
        maxWidth={getContainerSize()}
        sx={{ 
          mt: isMobile ? 2 : 4,
          px: { xs: 1, sm: 2, md: 3, lg: 4 },
        }}
      >
        <Stack 
          direction={isMobile ? "column" : "row"} 
          spacing={isMobile ? 1 : 2} 
          justifyContent="center" 
          sx={{ 
            mb: isMobile ? 2 : 3,
            maxWidth: isMobile ? '100%' : '800px',
            mx: 'auto',
            width: '100%'
          }}
        >
          <Button 
            variant="contained" 
            color="primary" 
            onClick={flipRandomTile}
            disabled={editMode || isImageLoading || cooldownActive}
            size={isMobile ? "medium" : "large"}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              flex: isMobile ? '1' : '2',
              minWidth: isMobile ? 'auto' : '180px',
              whiteSpace: 'nowrap'
            }}
          >
            {cooldownActive ? `Wait ${cooldownTime}s` : 'Pull Random Tile'}
            {cooldownActive && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  height: '3px',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  width: `${(cooldownTime / 3) * 100}%`,
                  transition: 'width 1s linear'
                }}
              />
            )}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleNewGame}
            disabled={editMode || isImageLoading}
            size={isMobile ? "medium" : "large"}
            sx={{
              flex: 1,
              minWidth: isMobile ? 'auto' : '120px',
              whiteSpace: 'nowrap'
            }}
          >
            New Game
          </Button>
          <Button
            variant="outlined"
            onClick={() => setLoadDialogOpen(true)}
            disabled={editMode || isImageLoading}
            size={isMobile ? "medium" : "large"}
            sx={{
              flex: 1,
              minWidth: isMobile ? 'auto' : '100px',
              whiteSpace: 'nowrap'
            }}
          >
            Load
          </Button>
          <Button
            variant={editMode ? "contained" : "outlined"}
            onClick={() => setEditMode(!editMode)}
            disabled={isImageLoading}
            size={isMobile ? "medium" : "large"}
            sx={{
              flex: 1,
              minWidth: isMobile ? 'auto' : '120px',
              whiteSpace: 'nowrap'
            }}
          >
            {editMode ? 'Confirm' : 'Edit Board'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => setSaveDialogOpen(true)}
            disabled={editMode || isImageLoading}
            size={isMobile ? "medium" : "large"}
            sx={{
              flex: 1,
              minWidth: isMobile ? 'auto' : '100px',
              whiteSpace: 'nowrap'
            }}
          >
            Save
          </Button>
        </Stack>

        <Box
          sx={{
            maxWidth: '900px',
            mx: 'auto',
            position: 'relative',
            minHeight: '300px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {isImageLoading && (
            <Box
              sx={{
                position: 'absolute',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: 3,
                borderRadius: 2,
                backdropFilter: 'blur(5px)'
              }}
            >
              <CircularProgress size={48} />
              <Typography variant="h6" color="text.secondary">
                Generating new board...
              </Typography>
            </Box>
          )}
          <Box
            sx={{
              display: isImageLoading ? 'none' : 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '12px',
              transition: 'opacity 0.3s ease'
            }}
          >
            {/* Column Headers */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: editMode 
                  ? `${getTileWidth()}px repeat(5, 1fr)` 
                  : 'repeat(5, 1fr)',
                gap: '6px',
                width: 'fit-content',
                mb: 1
              }}
            >
              {/* Empty cell in top-left corner */}
              {editMode && <Box sx={{ width: getTileWidth() }} />}
              
              {/* Column headers */}
              {columnHeaders.map((header, index) => (
                <Paper
                  key={`header-${index}`}
                  sx={{
                    minHeight: '60px',
                    height: 'auto',
                    width: getTileWidth(),
                    cursor: editMode ? 'text' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#e3f2fd',
                    padding: '8px',
                    boxSizing: 'border-box',
                    borderRadius: '4px'
                  }}
                  elevation={0}
                  onClick={() => handleColumnHeaderClick(index)}
                >
                  {editingColumnIndex === index ? (
                    <TextField
                      value={header}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleColumnHeaderChange(e, index)
                      }
                      onBlur={handleColumnHeaderBlur}
                      onKeyDown={(e) => handleColumnHeaderKeyPress(e, index)}
                      autoFocus
                      multiline
                      maxRows={4}
                      inputProps={{
                        maxLength: 60,
                        style: {
                          textAlign: 'center',
                          fontSize: getHeaderFontSize(header),
                          fontWeight: 'bold',
                          padding: '4px 8px',
                          lineHeight: '1.2'
                        }
                      }}
                      SelectProps={{
                        native: true
                      }}
                      onFocus={(e) => e.target.select()}
                      size="small"
                      sx={{ 
                        width: '95%',
                        '& .MuiInputBase-root': {
                          padding: '4px'
                        }
                      }}
                    />
                  ) : (
                    <Typography 
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        color: 'primary.main',
                        fontSize: getHeaderFontSize(header),
                        lineHeight: '1.2',
                        wordBreak: 'break-word',
                        textAlign: 'center'
                      }}
                    >
                      {header}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>

            {/* Main Grid with Row Headers and Tiles */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: editMode 
                  ? `${getTileWidth()}px repeat(5, 1fr)` 
                  : 'repeat(5, 1fr)',
                gap: '6px',
                width: 'fit-content',
              }}
            >
              {/* Render 5 rows */}
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <React.Fragment key={`row-${rowIndex}`}>
                  {/* Row header */}
                  {editMode && (
                    <Paper
                      sx={{
                        minHeight: getTileHeight(),
                        width: getTileWidth(),
                        cursor: editMode ? 'text' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#e3f2fd',
                        padding: '8px',
                        boxSizing: 'border-box',
                        transition: 'opacity 0.3s ease',
                        borderRadius: '4px'
                      }}
                      elevation={0}
                      onClick={() => handleRowHeaderClick(rowIndex)}
                    >
                      {editingRowIndex === rowIndex ? (
                        <TextField
                          value={rowHeaders[rowIndex]}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                            handleRowHeaderChange(e, rowIndex)
                          }
                          onBlur={handleRowHeaderBlur}
                          onKeyDown={(e) => handleRowHeaderKeyPress(e, rowIndex)}
                          autoFocus
                          multiline
                          maxRows={4}
                          inputProps={{
                            maxLength: 60,
                            style: {
                              textAlign: 'center',
                              fontSize: getHeaderFontSize(rowHeaders[rowIndex]),
                              fontWeight: 'bold',
                              padding: '4px 8px',
                              lineHeight: '1.2'
                            }
                          }}
                          SelectProps={{
                            native: true
                          }}
                          onFocus={(e) => e.target.select()}
                          size="small"
                          sx={{ 
                            width: '95%',
                            '& .MuiInputBase-root': {
                              padding: '4px'
                            }
                          }}
                        />
                      ) : (
                        <Typography 
                          variant="h6"
                          sx={{
                            fontWeight: 'bold',
                            color: 'primary.main',
                            fontSize: getHeaderFontSize(rowHeaders[rowIndex]),
                            lineHeight: '1.2',
                            wordBreak: 'break-word',
                            textAlign: 'center'
                          }}
                        >
                          {rowHeaders[rowIndex]}
                        </Typography>
                      )}
                    </Paper>
                  )}

                  {/* Render tiles for this row */}
                  {tiles
                    .filter(tile => tile.gridPosition.row === rowIndex)
                    .map((tile) => {
                      const isFirstRow = tile.gridPosition.row === 0;
                      const isLastRow = tile.gridPosition.row === 4;
                      const isFirstCol = tile.gridPosition.col === 0;
                      const isLastCol = tile.gridPosition.col === 4;

                      const borderRadius = {
                        borderTopLeftRadius: isFirstRow && isFirstCol ? '12px' : '0px',
                        borderTopRightRadius: isFirstRow && isLastCol ? '12px' : '0px',
                        borderBottomLeftRadius: isLastRow && isFirstCol ? '12px' : '0px',
                        borderBottomRightRadius: isLastRow && isLastCol ? '12px' : '0px',
                      };

                      return (
                        <Paper
                          key={tile.id}
                          sx={{
                            height: getTileHeight(),
                            width: getTileWidth(),
                            cursor: 'pointer',
                            overflow: 'hidden',
                            backgroundColor: 'white',
                            borderRadius: '0px',
                            ...borderRadius,
                            position: 'relative',
                            transition: 'transform 0.2s ease',
                            transform: tile.highlighted ? 'translateZ(12px)' : 'none',
                            '& .tile-front': {
                              backgroundColor: tile.highlighted ? '#e3f2fd' : 'white',
                              transition: 'all 0.3s ease',
                              transform: tile.highlighted ? 'scale(1.02)' : 'none',
                            },
                            '@keyframes float': {
                              '0%': { transform: 'translateZ(12px)' },
                              '50%': { transform: 'translateZ(16px)' },
                              '100%': { transform: 'translateZ(12px)' },
                            },
                            '@keyframes celebrate': {
                              '0%': { transform: 'scale(1) rotate(0deg)' },
                              '25%': { transform: 'scale(1.1) rotate(-5deg)' },
                              '50%': { transform: 'scale(1) rotate(0deg)' },
                              '75%': { transform: 'scale(1.1) rotate(5deg)' },
                              '100%': { transform: 'scale(1) rotate(0deg)' },
                            },
                            animation: tile.isWinningTile && tile.isAnimating
                              ? 'celebrate 1s ease-in-out infinite'
                              : tile.highlighted 
                                ? 'float 3s ease-in-out infinite' 
                                : 'none',
                            zIndex: tile.highlighted || tile.isWinningTile ? 1 : 'auto',
                            boxShadow: tile.isWinningTile 
                              ? '0 0 15px rgba(220, 0, 78, 0.5)' 
                              : undefined,
                            border: tile.isWinningTile 
                              ? '3px solid #dc004e'
                              : undefined,
                          }}
                          elevation={tile.highlighted ? 8 : 3}
                          onClick={() => handleTileClick(tile.id)}
                          className={`tile-flipper ${tile.selected ? 'tile-flipped' : ''}`}
                        >
                          <div className="tile-inner">
                            <div className="tile-front">
                              <Typography 
                                variant={isMobile ? "body1" : "h6"}
                                sx={{
                                  padding: isMobile ? '0.25rem' : '0.5rem',
                                  wordBreak: 'break-word',
                                  textAlign: 'center',
                                  fontSize: () => {
                                    const baseSize = isMobile ? 0.8 : 1;
                                    return tile.value.length > 10 
                                      ? `${baseSize * 0.8}rem` 
                                      : `${baseSize * 1.25}rem`;
                                  }
                                }}
                              >
                                {tile.value}
                              </Typography>
                            </div>
                            <div 
                              className="tile-back"
                              style={{
                                backgroundImage: `url(${tile.stickerUrl})`,
                                backgroundSize: 'contain',
                                backgroundPosition: 'center',
                                backgroundColor: 'white',
                                backgroundRepeat: 'no-repeat',
                                ...borderRadius,
                              }}
                            />
                          </div>
                        </Paper>
                      );
                    })}
                </React.Fragment>
              ))}
            </Box>
          </Box>
        </Box>

        {bingo && (
          <Box sx={{ 
            mt: isMobile ? 2 : 3,
            maxWidth: '600px',
            mx: 'auto'
          }}>
            <Typography variant="h4" color="secondary" align="center">
              BINGO! 🎉
            </Typography>
          </Box>
        )}

        <Dialog
          open={resetDialogOpen}
          onClose={handleResetCancel}
          aria-labelledby="reset-dialog-title"
          aria-describedby="reset-dialog-description"
          disableEnforceFocus
          disablePortal
        >
          <DialogTitle id="reset-dialog-title">
            Maximum Games Reached
          </DialogTitle>
          <DialogContent>
            <Typography id="reset-dialog-description">
              You have reached the maximum limit of 5 games. Please delete an existing game before creating a new one.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleResetCancel} color="primary">
              Cancel
            </Button>
            <Button onClick={() => {
              setResetDialogOpen(false);
              setLoadDialogOpen(true);
            }} color="secondary" variant="contained" autoFocus>
              Manage Games
            </Button>
          </DialogActions>
        </Dialog>

        {/* Save Game Dialog */}
        <Dialog
          open={saveDialogOpen}
          onClose={() => setSaveDialogOpen(false)}
          aria-labelledby="save-dialog-title"
          disableEnforceFocus
          disablePortal
        >
          <DialogTitle id="save-dialog-title">
            Save Current Game
          </DialogTitle>
          <DialogContent>
            <Typography>
              This will save your current game progress. You can have up to 5 saved games.
              {savedGames.length >= 5 && ' The oldest save will be removed.'}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGame} color="primary" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Load Game Dialog */}
        <Dialog
          open={loadDialogOpen}
          onClose={() => setLoadDialogOpen(false)}
          aria-labelledby="load-dialog-title"
          maxWidth="sm"
          fullWidth
          disableEnforceFocus
          disablePortal
        >
          <DialogTitle id="load-dialog-title">
            Load Saved Game
          </DialogTitle>
          <DialogContent>
            {savedGames.length === 0 ? (
              <Typography>No saved games found.</Typography>
            ) : (
              <Stack spacing={2}>
                {savedGames
                  .slice()
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((game) => (
                    <Paper
                      key={game.timestamp}
                      sx={{
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1">
                          {`${game.tiles.filter(t => t.highlighted).length} Pulled / ${game.tiles.filter(t => t.selected).length} Completed Tiles`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(game.timestamp).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {game.bingo ? 'BINGO achieved!' : 'Game in progress'}
                        </Typography>
                      </Box>
                      <Box>
                        <Button
                          onClick={() => handleLoadGameClick(game)}
                          color="primary"
                          sx={{ mr: 1 }}
                        >
                          Load
                        </Button>
                        <Button
                          onClick={() => handleDeleteSave(game.timestamp)}
                          color="error"
                        >
                          Delete
                        </Button>
                      </Box>
                    </Paper>
                  ))}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLoadDialogOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Load Confirmation Dialog */}
        <Dialog
          open={loadConfirmDialogOpen}
          onClose={handleLoadCancel}
          aria-labelledby="load-confirm-dialog-title"
          aria-describedby="load-confirm-dialog-description"
          disableEnforceFocus
          disablePortal
        >
          <DialogTitle id="load-confirm-dialog-title">
            Save Current Game?
          </DialogTitle>
          <DialogContent>
            <Typography id="load-confirm-dialog-description">
              Would you like to save your current game progress before loading another game?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleLoadCancel} color="primary">
              Cancel
            </Button>
            <Button onClick={handleLoadConfirm} color="primary">
              Don't Save
            </Button>
            <Button onClick={handleSaveAndLoad} color="secondary" variant="contained" autoFocus>
              Save and Load
            </Button>
          </DialogActions>
        </Dialog>

        {/* New Game Confirmation Dialog */}
        <Dialog
          open={newGameDialogOpen}
          onClose={handleNewGameCancel}
          aria-labelledby="new-game-dialog-title"
          aria-describedby="new-game-dialog-description"
          disableEnforceFocus
          disablePortal
        >
          <DialogTitle id="new-game-dialog-title">
            Create New Game?
          </DialogTitle>
          <DialogContent>
            <Typography id="new-game-dialog-description">
              Are you sure you want to create a new game? Your current game progress will be lost unless you save it first.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleNewGameCancel} color="primary">
              Cancel
            </Button>
            <Button onClick={() => {
              setNewGameDialogOpen(false);
              if (savedGames.length >= 5) {
                setResetDialogOpen(true);
              } else {
                handleNewGameConfirm();
              }
            }} color="secondary" variant="contained" autoFocus>
              Create New Game
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
}

export default App;
