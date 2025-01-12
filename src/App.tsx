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
  artStyle?: string;
  lastUsedStyles?: string[];
  name?: string;
}

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
  const [currentArtStyle, setCurrentArtStyle] = useState<string | null>(null);
  const [lastUsedStyles, setLastUsedStyles] = useState<string[]>([]);
  const [lastUsedType, setLastUsedType] = useState<'creature' | 'item' | 'scene' | null>(null);
  const [pressTimer, setPressTimer] = useState<number | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [pressedTileId, setPressedTileId] = useState<number | null>(null);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<number | null>(null);
  const [editingGameName, setEditingGameName] = useState<number | null>(null);
  const [highlightConfirmDialogOpen, setHighlightConfirmDialogOpen] = useState(false);
  const [tileToHighlight, setTileToHighlight] = useState<number | null>(null);
  
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
      setCurrentArtStyle(gameState.artStyle || null);
      setLastUsedStyles(gameState.lastUsedStyles || []);
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
        timestamp: activeGameTimestamp,
        artStyle: currentArtStyle || undefined,
        lastUsedStyles
      };
      localStorage.setItem('bingoCurrentGame', JSON.stringify(currentGame));
    }
  }, [tiles, columnHeaders, rowHeaders, bingo, activeGameTimestamp, isImageLoading, currentArtStyle, lastUsedStyles]);

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
    // If we're regenerating, don't handle the click
    if (isRegenerating) return;

    const clickedTile = tiles.find(tile => tile.id === tileId);
    if (!clickedTile) return;

    if (editMode) {
      // In edit mode, allow highlighting unselected and unhighlighted tiles
      if (!clickedTile.selected && !clickedTile.highlighted) {
        setTileToHighlight(tileId);
        setHighlightConfirmDialogOpen(true);
      }
      return;
    }

    if (clickedTile.selected) return;

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

  const handleHighlightConfirm = async () => {
    if (tileToHighlight === null) return;

    try {
      const imageUrl = await generateAIImage();
      const newTiles = tiles.map(tile =>
        tile.id === tileToHighlight ? { ...tile, highlighted: true, stickerUrl: imageUrl } : tile
      );
      setTiles(newTiles);
    } catch (error) {
      console.error('Error generating image for manual highlight:', error);
      alert('Failed to generate image for the tile. Please try again.');
    }

    setHighlightConfirmDialogOpen(false);
    setTileToHighlight(null);
  };

  const handleHighlightCancel = () => {
    setHighlightConfirmDialogOpen(false);
    setTileToHighlight(null);
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
    const currentGame = savedGames.find(game => game.timestamp === activeGameTimestamp);
    
    const newSave: SavedGame = {
      tiles,
      columnHeaders,
      rowHeaders,
      bingo,
      timestamp: currentTimestamp,
      artStyle: currentArtStyle || undefined,
      lastUsedStyles,
      name: currentGame?.name || getDefaultGameName({ 
        tiles, columnHeaders, rowHeaders, bingo, 
        timestamp: currentTimestamp 
      })
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
    setCurrentArtStyle(savedGame.artStyle || null);
    setLastUsedStyles(savedGame.lastUsedStyles || []);
    setLastUsedType(null);
    setLoadDialogOpen(false);

    // Update the saved games to ensure the loaded game's name persists
    const updatedSaves = savedGames.map(game => 
      game.timestamp === savedGame.timestamp ? savedGame : game
    );
    setSavedGames(updatedSaves);
    localStorage.setItem('bingoSavedGames', JSON.stringify(updatedSaves));
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
    
    // If there's a current style, add it to lastUsedStyles before resetting
    if (currentArtStyle) {
      const newLastUsedStyles = [currentArtStyle, ...lastUsedStyles].slice(0, 3);
      setLastUsedStyles(newLastUsedStyles);
    }
    
    setCurrentArtStyle(null);
    setLastUsedType(null);
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
    setGameToDelete(timestamp);
    setDeleteConfirmDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (gameToDelete === null) return;
    
    const updatedSaves = savedGames.filter(game => game.timestamp !== gameToDelete);
    setSavedGames(updatedSaves);
    localStorage.setItem('bingoSavedGames', JSON.stringify(updatedSaves));
    
    if (gameToDelete === activeGameTimestamp) {
      setActiveGameTimestamp(null);
      const defaultColumnHeaders = ['B', 'I', 'N', 'G', 'O'];
      const defaultRowHeaders = ['100', '200', '300', '400', '500'];
      setColumnHeaders(defaultColumnHeaders);
      setRowHeaders(defaultRowHeaders);

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

    setDeleteConfirmDialogOpen(false);
    setGameToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmDialogOpen(false);
    setGameToDelete(null);
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

  const handleLoadCancel = () => {
    setLoadConfirmDialogOpen(false);
    setGameToLoad(null);
  };

  const generateAIImage = async () => {
    // Art Styles
    const artStyles = [
      "Painterly Traditional Fantasy",
      "Comic Book Style",
      "Art Nouveau Fantasy",
      "Cel-Shaded Cartoony",
      "Dark Fantasy",
      "Retro Storybook",
      "Surreal Dreamlike",
      "Hyper-Realistic",
      "Pop Surreal",
      "Vintage Fantasy"
    ];

    // If we don't have a current art style, select one randomly (excluding last 3 used)
    if (!currentArtStyle) {
      const availableStyles = artStyles.filter(style => !lastUsedStyles.includes(style));
      const selectedStyle = availableStyles[Math.floor(Math.random() * availableStyles.length)];
      setCurrentArtStyle(selectedStyle);
      
      // Update last used styles
      const newLastUsedStyles = [selectedStyle, ...lastUsedStyles].slice(0, 3);
      setLastUsedStyles(newLastUsedStyles);
    }

    // Use the current art style
    const style = currentArtStyle || artStyles[0];

    // Creatures
    const creatures = [
      // Mammals
      "fox", "deer", "bear", "rabbit", "wolf", "red panda", "squirrel", "hedgehog", "raccoon", "otter",
      "dormouse", "chipmunk", "badger", "lynx", "fawn", "arctic fox", "fennec fox", "flying squirrel",
      "pine marten", "stoat",
      
      // Birds
      "owl", "crow", "peacock", "dove", "eagle", "hummingbird", "sparrow", "bluejay", "cardinal",
      "chickadee", "woodpecker", "swan", "kingfisher", "barn owl", "robin", "wren", "magpie",
      "nightingale", "swallow", "finch",
      
      // Reptiles & Amphibians
      "dragon", "lizard", "snake", "turtle", "chameleon", "gecko", "salamander", "newt", "toad",
      "tree frog", "axolotl", "bearded dragon", "skink", "tortoise", "iguana", "garden snake",
      "grass snake", "fire-bellied newt", "spotted salamander", "leopard gecko",
      
      // Fish & Sea Creatures
      "koi", "angelfish", "shark", "whale", "seahorse", "goldfish", "betta fish", "clownfish",
      "starfish", "jellyfish", "octopus", "narwhal", "manta ray", "dolphin", "sea turtle",
      "lionfish", "sea dragon", "flying fish", "moorish idol", "pufferfish",
      
      // Insects & Arachnids
      "butterfly", "bee", "dragonfly", "firefly", "scarab", "ladybug", "moth", "praying mantis",
      "grasshopper", "cricket", "caterpillar", "spider", "ant", "cicada", "damselfly", "luna moth",
      "atlas moth", "jewel beetle", "walking stick", "leaf insect",
      
      // Fantastical Creatures
      "unicorn", "griffin", "dragon", "phoenix", "pegasus", "kitsune", "jackalope", "hippogriff",
      "basilisk", "chimera", "kraken", "mermaid", "centaur", "fairy", "sprite", "pixie", "selkie",
      "dragon hatchling", "baby phoenix", "tiny unicorn",
      
      // Mythological
      "forest spirit", "water elemental", "shadow creature", "light being", "nature guardian",
      "dryad", "nymph", "sylph", "gnome", "brownie", "leprechaun", "will-o'-wisp", "kirin",
      "tanuki", "cloud spirit", "tree spirit", "river spirit", "mountain spirit", "crystal being",
      "star creature"
    ];

    // Items
    const items = [
      // Magical Tools & Implements
      "enchanted compass", "floating lantern", "magical hourglass", "crystal orb", "singing bell",
      "wizard's staff", "enchanted brush", "crystal quill", "glowing compass", "mystic telescope",
      "divining rod", "enchanted mirror", "scrying bowl", "magic wand", "rune stones",
      "alchemy set", "spell book", "tarot deck", "crystal ball", "dowsing pendulum",
      
      // Clothing & Accessories
      "wizard's hat", "enchanted cloak", "magical boots", "glowing crown", "mystic amulet",
      "fairy wings", "crystal earrings", "magic ring", "enchanted bracelet", "witch's shawl",
      "magical brooch", "enchanted ribbon", "crystal tiara", "magic shoes", "witch's hat",
      "enchanted scarf", "magical gloves", "crystal necklace", "witch's belt", "magic glasses",
      
      // Books & Writing
      "floating spellbook", "ancient scroll", "magical map", "glowing runes", "enchanted diary",
      "witch's grimoire", "book of shadows", "magical journal", "enchanted quill", "living storybook",
      "secret recipe book", "garden journal", "herbal guide", "book of dreams", "crystal encyclopedia",
      "potion recipe book", "magical almanac", "enchanted notebook", "spell scroll", "fairy tale book",
      
      // Potions & Containers
      "rainbow potion", "starlight vial", "crystal flask", "bubble bottle", "moonlight elixir",
      "healing potion", "fairy dust jar", "magic ink bottle", "crystal decanter", "dream essence vial",
      "transformation potion", "love elixir", "wisdom brew", "luck potion", "sleeping draught",
      "truth serum", "growth elixir", "memory potion", "courage brew", "peace tincture",
      
      // Household & Garden
      "enchanted teapot", "magical watering can", "living broom", "crystal vase", "singing windchimes",
      "magic garden shears", "enchanted basket", "floating candle", "witch's cauldron", "magic mortar and pestle",
      "enchanted teacup", "magical kettle", "living doorknob", "crystal lamp", "witch's broom",
      "magic spinning wheel", "enchanted needle", "crystal bowl", "magical spoon", "enchanted thimble",
      
      // Musical & Sound
      "singing crystal", "magic music box", "enchanted flute", "fairy bells", "witch's whistle",
      "crystal chimes", "magical harp", "enchanted drum", "spirit whistle", "dream bells",
      "harmony stone", "musical locket", "singing shell", "magic ocarina", "crystal xylophone",
      "enchanted violin", "fairy pipes", "witch's rattle", "magical horn", "singing bowl"
    ];

    // Scenery
    const scenery = [
      // Buildings & Structures
      "cottage", "treehouse", "windmill", "lighthouse", "castle", "tower", "barn", "greenhouse",
      "cabin", "water mill", "stone bridge", "gazebo", "pavilion", "observatory", "temple",
      "fairy house", "mushroom house", "hobbit hole", "crystal tower", "floating castle",
      
      // Gardens & Cultivated Spaces
      "flower garden", "herb garden", "rose maze", "vegetable patch", "orchard", "tea garden",
      "zen garden", "butterfly garden", "wildflower meadow", "topiary garden", "hanging gardens",
      "secret garden", "cottage garden", "kitchen garden", "fairy garden", "moss garden",
      "rock garden", "water garden", "moonlight garden", "sunflower field",
      
      // Natural Formations
      "waterfall", "crystal cave", "ancient tree", "hot springs", "flowering valley", "misty mountains",
      "aurora sky", "coral reef", "tide pools", "rainbow falls", "glowworm cave", "stone arch",
      "cherry blossom grove", "bamboo forest", "redwood forest", "lavender field", "alpine meadow",
      "crystal spring", "starlit lagoon", "cloud forest",
      
      // Magical Places
      "fairy circle", "enchanted grove", "crystal glade", "dragon's lair", "phoenix nest",
      "unicorn sanctuary", "mermaid lagoon", "witch's garden", "wizard's study", "elven sanctuary",
      "magical library", "potion workshop", "enchanted fountain", "starlit clearing", "moonlit pool",
      "crystal sanctuary", "rainbow bridge", "dream portal", "time garden", "spirit shrine",
      
      // Cozy Spaces
      "reading nook", "tea room", "window seat", "garden bench", "covered porch", "courtyard",
      "conservatory", "art studio", "music room", "meditation space", "writing desk", "craft room",
      "library corner", "breakfast nook", "window garden", "candlelit study", "cozy attic",
      "plant-filled sunroom", "quilting room", "pottery workshop",
      
      // Seasonal & Weather
      "autumn forest", "winter wonderland", "spring meadow", "summer garden", "rainy street",
      "foggy morning", "snowy village", "autumn path", "spring creek", "summer twilight",
      "winter cottage", "misty dawn", "golden sunset", "starry night", "morning frost",
      "autumn leaves", "spring blossoms", "summer breeze", "winter moonlight", "rainbow after rain"
    ];

    // Select random elements from each category
    const creature = creatures[Math.floor(Math.random() * creatures.length)];
    const item = items[Math.floor(Math.random() * items.length)];
    const scene = scenery[Math.floor(Math.random() * scenery.length)];

    // Determine the next type based on the last used type
    let nextType: 'creature' | 'item' | 'scene';
    if (!lastUsedType) {
      // If no type has been used yet, randomly select one
      const types: ('creature' | 'item' | 'scene')[] = ['creature', 'item', 'scene'];
      nextType = types[Math.floor(Math.random() * types.length)];
    } else {
      // Rotate to the next type
      switch (lastUsedType) {
        case 'creature':
          nextType = 'item';
          break;
        case 'item':
          nextType = 'scene';
          break;
        case 'scene':
          nextType = 'creature';
          break;
      }
    }

    // Update the last used type
    setLastUsedType(nextType);

    // Build the prompt based on the selected type
    let element;
    switch (nextType) {
      case 'creature':
        element = creature;
        break;
      case 'item':
        element = item;
        break;
      case 'scene':
        element = scene;
        break;
    }
    
    const prompt = `${element}, ${style}, pure white background, single illustration, clean edges, no text, centered composition, isolated artwork`;
    const seed = Math.floor(Math.random() * 1000000);
    
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=256&height=256&nologo=true&style=cute&seed2=${seed + 1}`;
  };

  // Add new handlers for long press
  const handleTileMouseDown = async (tileId: number) => {
    const clickedTile = tiles.find(tile => tile.id === tileId);
    if (!clickedTile || !clickedTile.selected || isRegenerating) return;

    setPressedTileId(tileId);

    // Start a timer for long press
    const timer = window.setTimeout(async () => {
      setIsRegenerating(true);
      setPressedTileId(null);
      try {
        const newImageUrl = await generateAIImage();
        if (!newImageUrl) {
          throw new Error('Failed to generate image');
        }
        const newTiles = tiles.map(tile =>
          tile.id === tileId ? { ...tile, stickerUrl: newImageUrl } : tile
        );
        setTiles(newTiles);
      } catch (error) {
        console.error('Error regenerating image:', error);
        // Show error message to user
        alert('Failed to generate new image. Please try again.');
      } finally {
        setIsRegenerating(false);
      }
    }, 2000);

    setPressTimer(timer);
  };

  const handleTileMouseUp = () => {
    setPressedTileId(null);
    if (pressTimer) {
      window.clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleTileMouseLeave = () => {
    setPressedTileId(null);
    if (pressTimer) {
      window.clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const getDefaultGameName = (_game: SavedGame) => {
    // Find all games that use the default naming pattern
    const defaultNameGames = savedGames
      .filter(g => g.name?.startsWith('Saved Game '))
      .map(g => {
        const num = parseInt(g.name?.replace('Saved Game ', '') || '0');
        return isNaN(num) ? 0 : num;
      });

    // If no games with default names exist, start with 1
    if (defaultNameGames.length === 0) {
      return 'Saved Game 1';
    }

    // Find the highest number used and add 1
    const nextNumber = Math.max(...defaultNameGames) + 1;
    return `Saved Game ${nextNumber}`;
  };

  const handleGameNameEdit = (timestamp: number) => {
    setEditingGameName(timestamp);
  };

  const handleGameNameChange = (timestamp: number, newName: string) => {
    const updatedSaves = savedGames.map(game => 
      game.timestamp === timestamp 
        ? { ...game, name: newName.trim() || undefined }
        : game
    );
    setSavedGames(updatedSaves);
    localStorage.setItem('bingoSavedGames', JSON.stringify(updatedSaves));
    setEditingGameName(null);
  };

  const handleGameNameKeyPress = (event: React.KeyboardEvent, timestamp: number) => {
    if (event.key === 'Enter') {
      const input = event.target as HTMLInputElement;
      handleGameNameChange(timestamp, input.value);
    } else if (event.key === 'Escape') {
      setEditingGameName(null);
    }
  };

  const getGameStatusText = (game: SavedGame) => {
    const pulledCount = game.tiles.filter(t => t.highlighted).length;
    const completedCount = game.tiles.filter(t => t.selected).length;
    return game.bingo 
      ? `BINGO / ${pulledCount} Selected / ${completedCount} Completed`
      : `${pulledCount} Selected / ${completedCount} Completed`;
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) + ' - ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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
            mb: isMobile ? 1 : 2,
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
            {cooldownActive ? `Wait ${cooldownTime}s` : 'Select Random Tile'}
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
                            cursor: tile.selected ? 'pointer' : tile.highlighted ? 'pointer' : 'default',
                            overflow: 'hidden',
                            backgroundColor: 'white',
                            borderRadius: '0px',
                            ...borderRadius,
                            position: 'relative',
                            transition: 'all 0.2s ease, transform 0.2s ease',
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
                            opacity: pressedTileId === tile.id ? 0.7 : 1
                          }}
                          elevation={tile.highlighted ? 8 : 3}
                          onClick={() => handleTileClick(tile.id)}
                          onMouseDown={() => handleTileMouseDown(tile.id)}
                          onMouseUp={handleTileMouseUp}
                          onMouseLeave={handleTileMouseLeave}
                          onTouchStart={() => handleTileMouseDown(tile.id)}
                          onTouchEnd={handleTileMouseUp}
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
                      elevation={0}
                      sx={{
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        border: '1px solid #e0e0e0',
                        borderRadius: 1
                      }}
                    >
                      <Box sx={{ flex: 1, mr: 2 }}>
                        {editingGameName === game.timestamp ? (
                          <TextField
                            autoFocus
                            defaultValue={game.name || getDefaultGameName(game)}
                            onBlur={(e) => handleGameNameChange(game.timestamp, e.target.value)}
                            onKeyDown={(e) => handleGameNameKeyPress(e, game.timestamp)}
                            size="small"
                            fullWidth
                            inputProps={{
                              maxLength: 50,
                              style: { 
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                textAlign: 'left'
                              }
                            }}
                            sx={{
                              '& .MuiInputBase-input': {
                                textAlign: 'left'
                              }
                            }}
                          />
                        ) : (
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': {
                                textDecoration: 'underline'
                              },
                              textAlign: 'left',
                              fontWeight: 'bold',
                              mb: 0.5
                            }}
                            onClick={() => handleGameNameEdit(game.timestamp)}
                          >
                            {game.name || getDefaultGameName(game)}
                          </Typography>
                        )}
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            mb: 0.5,
                            textAlign: 'left',
                            width: '100%'
                          }}
                        >
                          {formatDateTime(game.timestamp)}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color={game.bingo ? "secondary.main" : "text.secondary"}
                          sx={{ 
                            textAlign: 'left',
                            width: '100%'
                          }}
                        >
                          {getGameStatusText(game)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Button
                          onClick={() => handleDeleteSave(game.timestamp)}
                          color="error"
                          sx={{ mr: 1 }}
                        >
                          Delete
                        </Button>
                        <Button
                          onClick={() => handleLoadGameClick(game)}
                          color="primary"
                        >
                          Load
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
          PaperProps={{
            sx: {
              width: '80%',
              maxWidth: '480px'
            }
          }}
        >
          <DialogTitle id="load-confirm-dialog-title">
            Unsaved Progress
          </DialogTitle>
          <DialogContent>
            <Typography id="load-confirm-dialog-description">
              Your current game has unsaved progress. Would you like to save it before loading another game?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleLoadCancel} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setLoadConfirmDialogOpen(false);
                setLoadDialogOpen(false);
                setSaveDialogOpen(true);
              }} 
              color="primary"
            >
              Save
            </Button>
            <Button 
              onClick={handleLoadConfirm} 
              color="secondary" 
              variant="contained"
            >
              Load
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

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmDialogOpen}
          onClose={handleDeleteCancel}
          aria-labelledby="delete-confirm-dialog-title"
          aria-describedby="delete-confirm-dialog-description"
          disableEnforceFocus
          disablePortal
          PaperProps={{
            sx: {
              width: '80%',
              maxWidth: '480px' // 80% of Material-UI's sm breakpoint (600px)
            }
          }}
        >
          <DialogTitle id="delete-confirm-dialog-title">
            Delete Game?
          </DialogTitle>
          <DialogContent>
            <Typography id="delete-confirm-dialog-description">
              Are you sure you want to delete this saved game? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Highlight Confirmation Dialog */}
        <Dialog
          open={highlightConfirmDialogOpen}
          onClose={handleHighlightCancel}
          aria-labelledby="highlight-confirm-dialog-title"
          aria-describedby="highlight-confirm-dialog-description"
          disableEnforceFocus
          disablePortal
        >
          <DialogTitle id="highlight-confirm-dialog-title">
            Select Tile?
          </DialogTitle>
          <DialogContent>
            <Typography id="highlight-confirm-dialog-description">
              Are you sure you want to manually select this tile?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleHighlightCancel} color="primary">
              Cancel
            </Button>
            <Button onClick={handleHighlightConfirm} color="primary" variant="contained" autoFocus>
              Select Tile
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ThemeProvider>
  );
}

export default App;
