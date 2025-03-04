// Tower Defense Game - Complete Implementation with Audio System
// Architectural design implements state synchronization and audio processing pipeline

// Core game state architecture with balanced resource allocation and wave tracking
const gameState = {
  money: 75,                // Calibrated initial capital for strategic depth
  lives: 1,                 // Single-breach failure condition
  wave: 1,
  isPlaying: false,
  selectedTower: null,
  towers: [],
  enemies: [],
  projectiles: [],
  gridSize: 40,
  waveTimeout: null,
  enemySpawnInterval: null,
  mouseX: 0,
  mouseY: 0,
  gameScreen: 'mainMenu',   // Interface state machine
  effects: [],
  preparationPhase: true,
  preparationTime: 5,       // Streamlined preparation window
  preparationTimer: 5,
  difficultyFactor: 1.0,    // Dynamic scaling coefficient
  waveCompleted: false,
  unlockedTowers: ['basic'], // Progressive technology unlock system
  waveStarted: false        // Critical state tracking for progression synchronization
};

// Advanced tower classification system with capability metrics
const towerTypes = {
  basic: {
    name: 'Basic Tower',
    cost: 25,
    damage: 10,
    range: 120,
    fireRate: 1,
    color: '#4299e1',
    projectileColor: '#63b3ed',
    projectileSize: 4,
    barrelLength: 10,
    unlockWave: 1,
    description: 'Balanced defense with moderate rate of fire'
  },
  cannon: {
    name: 'Cannon Tower',
    cost: 60,
    damage: 30,
    range: 100,
    fireRate: 0.5,
    color: '#ed8936',
    projectileColor: '#f6ad55',
    projectileSize: 6,
    barrelLength: 14,
    unlockWave: 2,
    description: 'High damage but slow rate of fire'
  },
  magic: {
    name: 'Magic Tower',
    cost: 100,
    damage: 15,
    range: 150,
    fireRate: 1.5,
    color: '#9f7aea',
    projectileColor: '#d6bcfa',
    projectileSize: 5,
    barrelLength: 8,
    unlockWave: 3,
    description: 'Fast-firing magical projectiles'
  },
  sniper: {
    name: 'Sniper Tower',
    cost: 150,
    damage: 80,
    range: 250,           // Extended engagement envelope
    fireRate: 0.25,       // Precision timing model
    color: '#48bb78',
    projectileColor: '#c6f6d5',
    projectileSize: 3,
    barrelLength: 18,
    unlockWave: 5,
    description: 'Extreme range and damage with laser targeting',
    special: {
      type: 'critical',
      criticalChance: 0.2,    // Probabilistic damage amplification
      criticalMultiplier: 2.5
    }
  },
  bomber: {
    name: 'Bomber Tower',
    cost: 200,
    damage: 50,
    range: 180,
    fireRate: 0.3,
    color: '#f56565',
    projectileColor: '#fed7d7',
    projectileSize: 8,
    barrelLength: 12,
    unlockWave: 7,
    description: 'Area damage explosions affecting multiple enemies',
    special: {
      type: 'explosion',
      radius: 60,          // Area of effect parameter
      falloff: 0.5         // Damage attenuation coefficient
    }
  }
};

// Enemy classification with progressive resistances
const enemyTypes = {
  basic: {
    health: 40,
    speed: 1,
    reward: 10,
    color: '#f56565',
    size: 20,
    outlineColor: '#c53030'
  },
  fast: {
    health: 25,
    speed: 2,
    reward: 15,
    color: '#ecc94b',
    size: 15,
    outlineColor: '#b7791f'
  },
  strong: {
    health: 100,
    speed: 0.7,
    reward: 20,
    color: '#805ad5',
    size: 25,
    outlineColor: '#553c9a'
  },
  boss: {
    health: 300,
    speed: 0.5,
    reward: 50,
    color: '#e53e3e',
    size: 35,
    outlineColor: '#9b2c2c'
  }
};

// Spatial navigation network
const path = [
  { x: 0, y: 120 },
  { x: 200, y: 120 },
  { x: 200, y: 280 },
  { x: 400, y: 280 },
  { x: 400, y: 120 },
  { x: 600, y: 120 },
  { x: 600, y: 400 },
  { x: 800, y: 400 }
];

// Audio processing system with resource management and spatial distribution
const audioSystem = {
  context: null,
  masterGain: null,
  sounds: {},
  music: null,
  musicSource: null,
  musicGain: null,
  effectsGain: null,
  muted: false,
  initialized: false,
  
  // System initialization with context creation and node configuration
  initialize() {
    // Initialize Web Audio API context with fallback pattern
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create gain node hierarchy for discrete channel control
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      
      this.musicGain = this.context.createGain();
      this.musicGain.gain.value = 0.3; // Background music at 30% volume
      this.musicGain.connect(this.masterGain);
      
      this.effectsGain = this.context.createGain();
      this.effectsGain.gain.value = 0.5; // Effects at 50% volume
      this.effectsGain.connect(this.masterGain);
      
      // Load audio assets with promise-based pattern
      this.loadAudioAssets();
      
      // Create audio control interface
      this.createAudioControls();
      
      this.initialized = true;
      return true;
    } catch (e) {
      console.error("Audio system initialization failed:", e);
      return false;
    }
  },
  
  // Asynchronous resource acquisition with promise aggregation
  async loadAudioAssets() {
    const soundManifest = {
      'place': 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3',
      'shoot': 'https://assets.mixkit.co/sfx/preview/mixkit-laser-weapon-shot-1681.mp3',
      'explosion': 'https://assets.mixkit.co/sfx/preview/mixkit-explosion-impact-1682.mp3',
      'hit': 'https://assets.mixkit.co/sfx/preview/mixkit-bullet-hitting-wood-2361.mp3',
      'critical': 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-changing-tab-206.mp3',
      'wave': 'https://assets.mixkit.co/sfx/preview/mixkit-fairy-arcade-sparkle-875.mp3',
      'wave-complete': 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3',
      'coin': 'https://assets.mixkit.co/sfx/preview/mixkit-coin-win-notification-1992.mp3',
      'upgrade': 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3',
      'game-over': 'https://assets.mixkit.co/sfx/preview/mixkit-player-losing-or-failing-2042.mp3'
    };
    
    const musicUrl = 'https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3';
    
    try {
      // Load sound effects
      const loadPromises = Object.entries(soundManifest).map(([name, url]) => 
        this.loadSound(name, url)
      );
      
      // Wait for all sounds to load
      await Promise.all(loadPromises);
      
      // Load background music with loop configuration
      this.music = await this.loadMusic(musicUrl);
      console.log("Audio assets loaded successfully");
    } catch (error) {
      console.error("Error loading audio assets:", error);
    }
  },
  
  // Resource acquisition with buffer decoding
  async loadSound(name, url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      
      this.sounds[name] = audioBuffer;
      return audioBuffer;
    } catch (error) {
      console.error(`Error loading sound ${name}:`, error);
    }
  },
  
  // Music loading with specialized buffer management
  async loadMusic(url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return await this.context.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error("Error loading music:", error);
    }
  },
  
  // Sound playback with spatial positioning
  playSound(name, options = {}) {
    if (this.muted || !this.initialized || !this.context || !this.sounds[name]) return;
    
    // Resume audio context if suspended (browser autoplay policy)
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    
    try {
      // Create buffer source
      const source = this.context.createBufferSource();
      source.buffer = this.sounds[name];
      
      // Create gain node for this specific sound
      const gainNode = this.context.createGain();
      gainNode.gain.value = options.volume || 1;
      
      // Connect source → gain → effects channel
      source.connect(gainNode);
      gainNode.connect(this.effectsGain);
      
      // Apply optional rate/pitch variation for natural sound
      if (options.rateVariation) {
        const variation = (Math.random() * options.rateVariation) - (options.rateVariation / 2);
        source.playbackRate.value = 1 + variation;
      }
      
      // Start playback with optional delay
      source.start(this.context.currentTime + (options.delay || 0));
      
      return source;
    } catch (error) {
      console.error(`Error playing sound ${name}:`, error);
    }
  },
  
  // Music playback with loop control and crossfade capability
  startMusic() {
    if (this.muted || !this.initialized || !this.context || !this.music) return;
    
    // Resume audio context if suspended
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    
    try {
      // Stop existing music if playing
      if (this.musicSource) {
        this.musicSource.stop();
      }
      
      // Create source for background music
      this.musicSource = this.context.createBufferSource();
      this.musicSource.buffer = this.music;
      this.musicSource.loop = true;
      
      // Connect to music channel
      this.musicSource.connect(this.musicGain);
      
      // Start playback
      this.musicSource.start();
    } catch (error) {
      console.error("Error starting music:", error);
    }
  },
  
  // Stop music with optional fade out
  stopMusic(fadeOutTime = 0) {
    if (!this.initialized || !this.musicSource) return;
    
    if (fadeOutTime > 0 && this.musicGain) {
      // Create fade out effect
      const now = this.context.currentTime;
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0, now + fadeOutTime);
      
      // Stop after fade completes
      setTimeout(() => {
        if (this.musicSource) {
          this.musicSource.stop();
          this.musicSource = null;
        }
      }, fadeOutTime * 1000);
    } else {
      // Immediate stop
      this.musicSource.stop();
      this.musicSource = null;
    }
  },
  
  // Toggle mute state with smooth transition
  toggleMute() {
    if (!this.initialized) return false;
    
    this.muted = !this.muted;
    
    if (this.masterGain) {
      const now = this.context.currentTime;
      if (this.muted) {
        // Fade out over 0.2 seconds
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0, now + 0.2);
      } else {
        // Fade in over 0.2 seconds
        this.masterGain.gain.setValueAtTime(0, now);
        this.masterGain.gain.linearRampToValueAtTime(1, now + 0.2);
        
        // Resume context if needed
        if (this.context.state === 'suspended') {
          this.context.resume();
        }
        
        // Restart music if needed
        if (!this.musicSource) {
          this.startMusic();
        }
      }
    }
    
    return this.muted;
  },
  
  // Set sound effects volume
  setSoundVolume(volume) {
    if (!this.initialized || !this.effectsGain) return;
    
    this.effectsGain.gain.value = Math.max(0, Math.min(1, volume));
  },
  
  // Set music volume
  setMusicVolume(volume) {
    if (!this.initialized || !this.musicGain) return;
    
    this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
  },
  
  // Create UI controls for audio settings
  createAudioControls() {
    const controlContainer = document.createElement('div');
    controlContainer.id = 'audio-controls';
    controlContainer.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 100;
      display: flex;
      gap: 10px;
      pointer-events: auto;
    `;
    
    // Mute button
    const muteButton = document.createElement('button');
    muteButton.innerHTML = '🔊';
    muteButton.className = 'control-button';
    muteButton.addEventListener('click', () => {
      const muted = this.toggleMute();
      muteButton.innerHTML = muted ? '🔇' : '🔊';
    });
    
    controlContainer.appendChild(muteButton);
    
    // Style for controls
    const style = document.createElement('style');
    style.textContent = `
      .control-button {
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        border: 1px solid #4a5568;
        border-radius: 4px;
        width: 32px;
        height: 32px;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      
      .control-button:hover {
        background-color: rgba(0, 0, 0, 0.7);
      }
    `;
    document.head.appendChild(style);
    
    // Add to UI container
    const uiContainer = document.getElementById('ui-container');
    if (uiContainer) {
      uiContainer.appendChild(controlContainer);
    }
  }
};

// Initialize rendering context
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Interface component registry with direct references
const uiElements = {
  moneyElement: document.getElementById('money'),
  waveElement: document.getElementById('wave-number'),
  livesElement: document.getElementById('lives-count'),
  startButton: document.getElementById('start-button'),
  startScreen: document.getElementById('start-screen'),
  basicTowerButton: document.getElementById('basic-tower'),
  cannonTowerButton: document.getElementById('cannon-tower'),
  magicTowerButton: document.getElementById('magic-tower'),
  uiContainer: document.getElementById('ui-container'),
  gameContainer: document.getElementById('game-container')
};

// DOM recovery and reconstruction system
function repairGameInterface() {
  // Verify UI container exists
  let uiContainer = document.getElementById('ui-container');
  if (!uiContainer) {
    uiContainer = document.createElement('div');
    uiContainer.id = 'ui-container';
    document.getElementById('game-container').appendChild(uiContainer);
  }
  
  // Clear existing UI to prevent element duplication
  uiContainer.innerHTML = '';
  
  // Construct status indicators for resource metrics
  const statusBar = document.createElement('div');
  statusBar.className = 'status-bar';
  statusBar.innerHTML = `
    <div id="resources">Money: <span id="money">75</span></div>
    <div id="wave">Wave: <span id="wave-number">1</span></div>
    <div id="lives">Lives: <span id="lives-count">1</span></div>
  `;
  
  // Construct tower selection interface with composite layout
  const towerSelectionContainer = document.createElement('div');
  towerSelectionContainer.id = 'tower-selection-container';
  
  const towerSelection = document.createElement('div');
  towerSelection.id = 'tower-selection';
  
  // Generate tower selection matrix
  Object.entries(towerTypes).forEach(([type, data]) => {
    const towerButton = document.createElement('button');
    towerButton.id = `${type}-tower`;
    towerButton.className = 'tower-button';
    towerButton.dataset.type = type;
    towerButton.dataset.unlockWave = data.unlockWave;
    towerButton.innerHTML = `
      <div class="tower-icon" style="background-color: ${data.color}"></div>
      <div class="tower-info">
        <div class="tower-name">${data.name}</div>
        <div class="tower-cost">$${data.cost}</div>
      </div>
    `;
    towerButton.addEventListener('click', () => selectTower(type));
    towerSelection.appendChild(towerButton);
  });
  
  // Tower information panel
  const towerDescription = document.createElement('div');
  towerDescription.id = 'tower-description';
  towerDescription.textContent = 'Select a tower to see its description';
  
  // Assemble tower selection component
  towerSelectionContainer.appendChild(towerSelection);
  towerSelectionContainer.appendChild(towerDescription);
  
  // Compose primary UI elements
  uiContainer.appendChild(statusBar);
  uiContainer.appendChild(towerSelectionContainer);
  
  // Apply interface styling architecture
  const style = document.createElement('style');
  style.textContent = `
    #ui-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .status-bar {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      pointer-events: auto;
    }
    
    #tower-selection-container {
      background-color: rgba(0, 0, 0, 0.8);
      padding: 10px;
      border-top: 2px solid #4a5568;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
    }
    
    #tower-selection {
      display: flex;
      gap: 10px;
      justify-content: center;
    }
    
    .tower-button {
      background-color: #2d3748;
      border: 1px solid #4a5568;
      border-radius: 4px;
      padding: 5px;
      cursor: pointer;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.2s;
      width: 80px;
    }
    
    .tower-button:hover:not(:disabled) {
      background-color: #4a5568;
      transform: translateY(-2px);
    }
    
    .tower-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      filter: grayscale(100%);
    }
    
    .tower-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      margin-bottom: 5px;
    }
    
    .tower-info {
      text-align: center;
      font-size: 12px;
    }
    
    .tower-name {
      font-weight: bold;
      white-space: nowrap;
    }
    
    #tower-description {
      margin-top: 10px;
      text-align: center;
      font-size: 14px;
      color: #cbd5e0;
      min-height: 40px;
      padding: 5px;
    }
  `;
  document.head.appendChild(style);
  
  // Verify start screen exists
  let startScreen = document.getElementById('start-screen');
  if (!startScreen) {
    startScreen = document.createElement('div');
    startScreen.id = 'start-screen';
    document.getElementById('game-container').appendChild(startScreen);
  }
  
  // Configure tower description hover effects
  const towerButtons = document.querySelectorAll('.tower-button');
  towerButtons.forEach(button => {
    const towerType = button.dataset.type;
    const description = document.getElementById('tower-description');
    
    button.addEventListener('mouseover', () => {
      if (description) {
        description.innerHTML = `
          <strong>${towerTypes[towerType].name}</strong>: ${towerTypes[towerType].description}<br>
          <span style="color:#a0aec0">Damage: ${towerTypes[towerType].damage} | Range: ${towerTypes[towerType].range} | Fire Rate: ${towerTypes[towerType].fireRate}/s</span>
        `;
      }
    });
    
    button.addEventListener('mouseout', () => {
      if (description) {
        description.textContent = 'Select a tower to see its description';
      }
    });
  });
  
  // Create restart button for emergency state recovery
  createRestartButton();
}

// Main menu interface generation
function createMainMenu() {
  // Clear existing content
  uiElements.startScreen.innerHTML = '';
  
  // Create main menu elements
  const title = document.createElement('h1');
  title.textContent = 'Tower Defense';
  title.className = 'game-title';
  
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'menu-buttons';
  
  const startGameBtn = document.createElement('button');
  startGameBtn.id = 'start-game-btn';
  startGameBtn.textContent = 'Start Game';
  startGameBtn.className = 'menu-button';
  startGameBtn.addEventListener('click', startGame);
  
  const howToPlayBtn = document.createElement('button');
  howToPlayBtn.id = 'how-to-play-btn';
  howToPlayBtn.textContent = 'How To Play';
  howToPlayBtn.className = 'menu-button';
  howToPlayBtn.addEventListener('click', showHowToPlay);
  
  // Assemble menu
  buttonContainer.appendChild(startGameBtn);
  buttonContainer.appendChild(howToPlayBtn);
  
  uiElements.startScreen.appendChild(title);
  uiElements.startScreen.appendChild(buttonContainer);
  
  // Add CSS for menu styling
  const style = document.createElement('style');
  style.textContent = `
    .game-title {
      font-size: 48px;
      color: #fff;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
      margin-bottom: 30px;
    }
    
    .menu-buttons {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .menu-button {
      padding: 12px 24px;
      font-size: 18px;
      background-color: #2d3748;
      color: white;
      border: 2px solid #4a5568;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 200px;
      text-align: center;
    }
    
    .menu-button:hover {
      background-color: #4a5568;
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    }
    
    .how-to-play-container {
      background-color: rgba(0, 0, 0, 0.8);
      padding: 20px;
      border-radius: 8px;
      max-width: 600px;
      color: white;
      margin: 0 auto;
    }
    
    .how-to-play-container h2 {
      color: #48bb78;
      margin-bottom: 15px;
    }
    
    .how-to-play-container ul {
      text-align: left;
      margin-bottom: 20px;
    }
    
    .how-to-play-container li {
      margin-bottom: 8px;
    }
    
    .back-button {
      background-color: #4a5568;
      margin-top: 20px;
    }
  `;
  document.head.appendChild(style);
}

// Emergency state recovery mechanism
function createRestartButton() {
  const restartContainer = document.createElement('div');
  restartContainer.id = 'restart-container';
  restartContainer.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 100;
  `;
  
  const restartButton = document.createElement('button');
  restartButton.id = 'persistent-restart';
  restartButton.textContent = 'Restart Game';
  restartButton.style.cssText = `
    background-color: #2d3748;
    color: white;
    border: 1px solid #4a5568;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  `;
  
  // Hover effect
  restartButton.addEventListener('mouseover', () => {
    restartButton.style.backgroundColor = '#4a5568';
  });
  
  restartButton.addEventListener('mouseout', () => {
    restartButton.style.backgroundColor = '#2d3748';
  });
  
  // Restart functionality
  restartButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to restart the game?')) {
      audioSystem.playSound('upgrade');
      resetGame();
      gameState.gameScreen = 'mainMenu';
      createMainMenu();
      uiElements.startScreen.style.display = 'flex';
    }
  });
  
  restartContainer.appendChild(restartButton);
  document.getElementById('game-container').appendChild(restartContainer);
}

// Instructional interface component
function showHowToPlay() {
  gameState.gameScreen = 'howToPlay';
  
  // Clear existing content
  uiElements.startScreen.innerHTML = '';
  
  // Create how to play content
  const container = document.createElement('div');
  container.className = 'how-to-play-container';
  
  const title = document.createElement('h2');
  title.textContent = 'How To Play';
  
  const instructions = document.createElement('ul');
  
  const instructionsList = [
    'You have a 5-second preparation phase before enemies arrive',
    'Select a tower from the menu at the bottom',
    'Click on the map to place your tower (avoid the path)',
    'Towers automatically attack enemies in range',
    'Defeat enemies to earn money for more towers',
    'If even one enemy reaches the end, you lose!',
    'Each wave gets progressively more difficult',
    'New tower types unlock as you progress through waves'
  ];
  
  instructionsList.forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    instructions.appendChild(li);
  });
  
  const backButton = document.createElement('button');
  backButton.className = 'menu-button back-button';
  backButton.textContent = 'Back to Menu';
  backButton.addEventListener('click', () => {
    audioSystem.playSound('hit', { volume: 0.5 });
    gameState.gameScreen = 'mainMenu';
    createMainMenu();
  });
  
  container.appendChild(title);
  container.appendChild(instructions);
  container.appendChild(backButton);
  
  uiElements.startScreen.appendChild(container);
}

// Event registration system
function setupEventListeners() {
  canvas.addEventListener('click', handleCanvasClick);
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    gameState.mouseX = event.clientX - rect.left;
    gameState.mouseY = event.clientY - rect.top;
  });
}

// Application initialization with audio system integration
function init() {
  repairGameInterface();
  createMainMenu();
  setupEventListeners();
  updateUI();
  
  // Initialize audio system
  audioSystem.initialize();
}

// Game state transition to active phase with corrected wave initialization
function startGame() {
  gameState.isPlaying = true;
  gameState.gameScreen = 'game';
  gameState.preparationPhase = true;
  gameState.preparationTimer = gameState.preparationTime;
  gameState.wave = 1; // Explicitly initialize to wave 1
  gameState.waveStarted = false; // Track if wave has been started
  uiElements.startScreen.style.display = 'none';
  document.getElementById('ui-container').style.display = 'flex';
  
  // Start background music
  audioSystem.startMusic();
  audioSystem.playSound('upgrade', { volume: 0.6 });
  
  // Preparation phase notification
  createFloatingText(
    canvas.width / 2, 
    canvas.height / 2 - 40, 
    `Preparation Phase: ${gameState.preparationTimer} seconds`, 
    '#48bb78'
  );
  
  // Preparation phase countdown with state-aware progression
  const prepInterval = setInterval(() => {
    gameState.preparationTimer--;
    
    // Periodic notification system
    if (gameState.preparationTimer % 1 === 0) {
      createFloatingText(
        canvas.width / 2, 
        canvas.height / 2, 
        `Wave ${gameState.wave} in: ${gameState.preparationTimer}s`, 
        '#ffffff'
      );
    }
    
    if (gameState.preparationTimer <= 0) {
      clearInterval(prepInterval);
      gameState.preparationPhase = false;
      gameState.waveStarted = true; // Mark first wave as started
      audioSystem.playSound('wave');
      startWave();
    }
  }, 1000);
  
  updateUI();
}

// Tower selection system
function selectTower(towerType) {
  const towerData = towerTypes[towerType];
  const isUnlocked = gameState.wave >= towerData.unlockWave;
  const isAffordable = gameState.money >= towerData.cost;
  
  if (isUnlocked && isAffordable) {
    gameState.selectedTower = towerType;
    audioSystem.playSound('hit', { volume: 0.3 });
  } else if (!isUnlocked) {
    createFloatingText(canvas.width / 2, canvas.height / 2, `Unlocks at wave ${towerData.unlockWave}`, '#ef4444');
    audioSystem.playSound('hit', { volume: 0.2 });
  } else {
    createFloatingText(canvas.width / 2, canvas.height / 2, 'Not enough money!', '#ef4444');
    audioSystem.playSound('hit', { volume: 0.2 });
  }
}

// Canvas interaction handler
function handleCanvasClick(event) {
  if (!gameState.isPlaying || !gameState.selectedTower) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Grid-aligned positioning system
  const gridX = Math.floor(x / gameState.gridSize) * gameState.gridSize;
  const gridY = Math.floor(y / gameState.gridSize) * gameState.gridSize;

  // Placement validation
  if (isPositionValid(gridX, gridY)) {
    placeTower(gridX, gridY, gameState.selectedTower);
    gameState.selectedTower = null;
  } else {
    // Visual and auditory feedback for invalid placement
    createFloatingText(x, y, 'Invalid position!', '#ef4444');
    audioSystem.playSound('hit', { volume: 0.3 });
  }
}

// Visual effect system
function createFloatingText(x, y, text, color) {
  gameState.effects.push({
    type: 'text',
    x,
    y,
    text,
    color,
    alpha: 1,
    lifetime: 60,
    velocity: { x: 0, y: -1 }
  });
}

// Placement validation system with proximity detection
function isPositionValid(x, y) {
  // Boundary validation
  if (x < 20 || y < 20 || x > canvas.width - 20 || y > canvas.height - 20) {
    return false;
  }

  // Collision detection with existing structures
  for (const tower of gameState.towers) {
    if (Math.abs(tower.x - x) < gameState.gridSize && Math.abs(tower.y - y) < gameState.gridSize) {
      return false;
    }
  }

  // Path proximity validation with parametric assessment
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1].x - path[i].x;
    const dy = path[i + 1].y - path[i].y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(length / 10); // Precision factor

    for (let j = 0; j <= steps; j++) {
      const pathX = path[i].x + (dx * j / steps);
      const pathY = path[i].y + (dy * j / steps);
      const distance = Math.sqrt((pathX - x) ** 2 + (pathY - y) ** 2);
      
      if (distance < 30) {
        return false;
      }
    }
  }

  return true;
}

// Tower instantiation system with audio feedback
function placeTower(x, y, towerType) {
  const towerData = towerTypes[towerType];
  const tower = {
    x,
    y,
    type: towerType,
    lastShot: 0,
    target: null,
    angle: 0, // Rotation control
    ...towerData
  };

  // Initialize special capabilities
  if (towerData.special) {
    Object.assign(tower, towerData.special);
  }

  gameState.money -= tower.cost;
  gameState.towers.push(tower);
  
  // Placement audio feedback
  audioSystem.playSound('place', { volume: 0.6 });
  
  // Placement visual feedback
  for (let i = 0; i < 8; i++) {
    const angle = Math.PI * 2 * (i / 8);
    gameState.effects.push({
      type: 'particle',
      x: x,
      y: y,
      radius: 4,
      color: tower.color,
      velocity: {
        x: Math.cos(angle) * 2,
        y: Math.sin(angle) * 2
      },
      alpha: 1,
      lifetime: 30
    });
  }
  
  updateUI();
}

// Progressive wave generation system with dynamic difficulty scaling
function startWave() {
  // Clear existing wave
  if (gameState.enemySpawnInterval) {
    clearInterval(gameState.enemySpawnInterval);
  }
  
  // Wave composition system with progressive difficulty
  const waveDifficulty = calculateWaveDifficulty();
  const baseEnemyCount = 8;
  const enemyCount = Math.floor(baseEnemyCount * (1 + (gameState.wave - 1) * 0.2));
  let enemiesSpawned = 0;
  gameState.waveCompleted = false;

  // Dynamic spawn interval with progressive acceleration
  const baseInterval = 1200; // Base milliseconds between spawns
  const intervalReduction = 50; // Reduction per wave
  const minInterval = 300; // Minimum spawn interval
  const spawnInterval = Math.max(minInterval, baseInterval - (gameState.wave - 1) * intervalReduction);

  // Enemy generation system
  gameState.enemySpawnInterval = setInterval(() => {
    if (enemiesSpawned >= enemyCount) {
      clearInterval(gameState.enemySpawnInterval);
      gameState.enemySpawnInterval = null;
      return;
    }

    // Enemy type selection based on wave progression
    const enemyType = selectEnemyTypeForWave(gameState.wave);
    spawnEnemy(enemyType);
    enemiesSpawned++;
  }, spawnInterval);

  updateUI();
}

// Dynamic difficulty calculation system
function calculateWaveDifficulty() {
  // Base difficulty curve with progressive scaling
  gameState.difficultyFactor = 1.0 + (gameState.wave - 1) * 0.15;
  
  // Logarithmic difficulty scaling for extended gameplay
  if (gameState.wave > 10) {
    gameState.difficultyFactor += Math.log10(gameState.wave - 9) * 0.5;
  }
  
  return gameState.difficultyFactor;
}

// Enemy type distribution system with progressive unlock
function selectEnemyTypeForWave(wave) {
  // Random selection with wave-dependent probabilities
  const rand = Math.random();
  
  // Boss wave pattern on every 5th wave
  if (wave % 5 === 0) {
    return rand < 0.3 ? 'boss' : 'strong';
  }
  
  // Progressive enemy introduction
  if (wave <= 2) {
    return 'basic';
  } else if (wave <= 4) {
    return rand < 0.7 ? 'basic' : 'fast';
  } else if (wave <= 7) {
    if (rand < 0.5) return 'basic';
    else if (rand < 0.8) return 'fast';
    else return 'strong';
  } else {
    if (rand < 0.3) return 'basic';
    else if (rand < 0.6) return 'fast';
    else if (rand < 0.9) return 'strong';
    else return 'boss';
  }
}

// Enemy instantiation system with difficulty scaling
function spawnEnemy(type) {
  // Calculate scaled health based on wave progression
  const scaledHealth = Math.floor(enemyTypes[type].health * gameState.difficultyFactor);
  
  const enemy = {
    x: path[0].x,
    y: path[0].y,
    type,
    health: scaledHealth,
    maxHealth: scaledHealth,
    speed: enemyTypes[type].speed,
    reward: Math.ceil(enemyTypes[type].reward * (1 + (gameState.wave - 1) * 0.1)),
    color: enemyTypes[type].color,
    outlineColor: enemyTypes[type].outlineColor,
    size: enemyTypes[type].size,
    pathIndex: 0,
    progress: 0,
    // Visual enhancement properties
    pulseEffect: 0,
    pulseDirection: 1
  };

  gameState.enemies.push(enemy);
}

// Game state update orchestration
function update() {
  const now = Date.now();

  // Check for wave completion condition
  checkWaveCompletion();

  // Update enemy movement and state
  updateEnemies();
  
  // Update tower targeting and firing
  updateTowers(now);

  // Update projectile movement and collision
  updateProjectiles();
  
  // Update visual effects
  updateEffects();
}

// Wave progression detection and management with corrected state transitions
function checkWaveCompletion() {
  if (!gameState.waveCompleted && 
      gameState.enemies.length === 0 && 
      gameState.enemySpawnInterval === null &&
      gameState.waveStarted) {  // Only proceed if wave actually started
    
    gameState.waveCompleted = true;
    
    // Wave completion notification with audio feedback
    audioSystem.playSound('wave-complete');
    createFloatingText(
      canvas.width / 2, 
      canvas.height / 2 - 40, 
      `Wave ${gameState.wave} Complete!`, 
      '#48bb78'
    );
    
    // Resource bonus with progressive scaling
    const baseBonus = 20;
    const waveBonus = Math.floor(baseBonus + gameState.wave * 5);
    
    // Preparation phase for next wave
    let nextWaveCountdown = 8;
    
    // Resource allocation notification
    setTimeout(() => {
      gameState.money += waveBonus;
      audioSystem.playSound('coin', { volume: 0.7 });
      createFloatingText(
        canvas.width / 2,
        canvas.height / 2,
        `+${waveBonus} gold!`,
        '#f6e05e'
      );
      updateUI();
    }, 1000);
    
    // Wave transition countdown with explicit state increment
    const countdownInterval = setInterval(() => {
      nextWaveCountdown--;
      
      if (nextWaveCountdown % 2 === 0 || nextWaveCountdown <= 3) {
        createFloatingText(
          canvas.width / 2,
          canvas.height / 2 + 40,
          `Next wave in ${nextWaveCountdown}...`,
          '#ffffff'
        );
      }
      
      if (nextWaveCountdown <= 0) {
        clearInterval(countdownInterval);
        gameState.wave++; // Increment wave counter only here
        gameState.waveCompleted = false;
        audioSystem.playSound('wave');
        startWave();
      }
    }, 1000);
  }
}

// Enemy update system
function updateEnemies() {
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    const enemy = gameState.enemies[i];
    
    // Visual effect state management
    enemy.pulseEffect += 0.1 * enemy.pulseDirection;
    if (enemy.pulseEffect > 1 || enemy.pulseEffect < 0) {
      enemy.pulseDirection *= -1;
    }
    
    // Path navigation with parametric progression
    const currentPathPoint = path[enemy.pathIndex];
    const nextPathPoint = path[enemy.pathIndex + 1];
    
    const dx = nextPathPoint.x - currentPathPoint.x;
    const dy = nextPathPoint.y - currentPathPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    enemy.progress += enemy.speed;
    
    if (enemy.progress >= distance) {
      enemy.progress = 0;
      enemy.pathIndex++;
      
      // Endpoint detection - critical failure condition
      if (enemy.pathIndex >= path.length - 1) {
        gameState.lives--;
        
        // Enhanced visual and audio feedback for breach
        audioSystem.playSound('game-over', { volume: 0.5 });
        
        for (let j = 0; j < 20; j++) {
          const angle = Math.PI * 2 * (j / 20);
          const speed = 2 + Math.random() * 3;
          gameState.effects.push({
            type: 'particle',
            x: enemy.x,
            y: enemy.y,
            radius: 5,
            color: '#ef4444',
            velocity: {
              x: Math.cos(angle) * speed,
              y: Math.sin(angle) * speed
            },
            alpha: 1,
            lifetime: 60
          });
        }
        
        createFloatingText(enemy.x, enemy.y - 30, 'BREACH!', '#ef4444');
        gameState.enemies.splice(i, 1);
        updateUI();
        
        // Immediate termination on breach
        gameOver("Enemy Breach Detected");
        return;
      }
    }
    
    // Position interpolation
    const progressPercent = enemy.progress / distance;
    enemy.x = currentPathPoint.x + dx * progressPercent;
    enemy.y = currentPathPoint.y + dy * progressPercent;
  }
}

// Tower targeting and firing system with audio feedback
function updateTowers(now) {
  for (const tower of gameState.towers) {
    // Rate of fire management
    if (now - tower.lastShot < 1000 / tower.fireRate) continue;
    
    // Target acquisition with proximity assessment
    let closestEnemy = null;
    let closestDistance = tower.range;
    
    for (const enemy of gameState.enemies) {
      const dx = enemy.x - tower.x;
      const dy = enemy.y - tower.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < closestDistance) {
        closestEnemy = enemy;
        closestDistance = distance;
      }
    }
    
    // Targeting and firing mechanics
    if (closestEnemy) {
      // Turret rotation calculation
      const dx = closestEnemy.x - tower.x;
      const dy = closestEnemy.y - tower.y;
      tower.angle = Math.atan2(dy, dx);
      
      tower.lastShot = now;
      tower.target = closestEnemy;
      
      // Type-specific attack handling
      if (tower.type === 'sniper') {
        // Direct hit system for sniper with audio feedback
        audioSystem.playSound('shoot', { 
          volume: 0.7, 
          rateVariation: 0.05 
        });
        
        // Calculate critical hit
        const isCritical = Math.random() < tower.criticalChance;
        const damage = isCritical ? Math.floor(tower.damage * tower.criticalMultiplier) : tower.damage;
        
        // Apply damage
        closestEnemy.health -= damage;
        
        // Create laser effect
        for (let dist = 10; dist <= closestDistance; dist += 10) {
          const x = tower.x + Math.cos(tower.angle) * dist;
          const y = tower.y + Math.sin(tower.angle) * dist;
          
          gameState.effects.push({
            type: 'particle',
            x: x,
            y: y,
            radius: 1,
            color: '#c6f6d5',
            velocity: { x: 0, y: 0 },
            alpha: 0.7,
            lifetime: 5
          });
        }
        
        // Impact effect
        for (let j = 0; j < 8; j++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 2;
          
          gameState.effects.push({
            type: 'particle',
            x: closestEnemy.x,
            y: closestEnemy.y,
            radius: 2,
            color: '#c6f6d5',
            velocity: {
              x: Math.cos(angle) * speed,
              y: Math.sin(angle) * speed
            },
            alpha: 1,
            lifetime: 15
          });
        }
        
        // Critical hit sound
        if (isCritical) {
          audioSystem.playSound('critical', { volume: 0.6 });
        }
        
        // Damage text
        createFloatingText(
          closestEnemy.x, 
          closestEnemy.y - 20, 
          isCritical ? `CRITICAL! -${damage}` : `-${damage}`, 
          isCritical ? '#f6e05e' : '#ff9999'
        );
        
        // Check if enemy defeated
        if (closestEnemy.health <= 0) {
          defeatEnemy(closestEnemy);
        }
      } else if (tower.type === 'bomber') {
        // Create explosive projectile
        createBomberProjectile(tower, closestEnemy);
      } else {
        // Standard projectile for other towers
        createStandardProjectile(tower, closestEnemy);
      }
    }
  }
}

// Standard projectile creation with audio feedback
function createStandardProjectile(tower, target) {
  const angle = Math.atan2(target.y - tower.y, target.x - tower.x);
  const spawnX = tower.x + Math.cos(angle) * tower.barrelLength;
  const spawnY = tower.y + Math.sin(angle) * tower.barrelLength;
  
  // Type-specific audio feedback
  switch(tower.type) {
    case 'magic':
      audioSystem.playSound('shoot', { 
        volume: 0.5, 
        rateVariation: 0.2 
      });
      break;
    default:
      audioSystem.playSound('shoot', { 
        volume: 0.4, 
        rateVariation: 0.1 
      });
  }
  
  gameState.projectiles.push({
    x: spawnX,
    y: spawnY,
    targetX: target.x,
    targetY: target.y,
    target: target,
    damage: tower.damage,
    speed: 5,
    color: tower.projectileColor,
    size: tower.projectileSize,
    type: tower.type,
    createTrail: true,
    trailInterval: 2,
    trailCounter: 0
  });
}

// Bomber projectile with area effect and audio feedback
function createBomberProjectile(tower, target) {
  const angle = Math.atan2(target.y - tower.y, target.x - tower.x);
  const spawnX = tower.x + Math.cos(angle) * tower.barrelLength;
  const spawnY = tower.y + Math.sin(angle) * tower.barrelLength;
  
  // Launch audio
  audioSystem.playSound('shoot', { 
    volume: 0.6, 
    rateVariation: 0.1 
  });
  
  // Launch smoke effect
  for (let i = 0; i < 5; i++) {
    const smokeAngle = angle + Math.PI + (Math.random() * 0.5 - 0.25);
    gameState.effects.push({
      type: 'particle',
      x: spawnX,
      y: spawnY,
      radius: 3 + Math.random() * 3,
      color: 'rgba(160, 174, 192, 0.8)',
      velocity: {
        x: Math.cos(smokeAngle) * (1 + Math.random()),
        y: Math.sin(smokeAngle) * (1 + Math.random())
      },
      alpha: 0.7,
      lifetime: 10 + Math.random() * 10
    });
  }
  
  gameState.projectiles.push({
    x: spawnX,
    y: spawnY,
    targetX: target.x,
    targetY: target.y,
    target: target,
    damage: tower.damage,
    speed: 4,
    color: tower.projectileColor,
    size: tower.projectileSize,
    type: 'bomber',
    createTrail: true,
    trailInterval: 3,
    trailCounter: 0,
    explosionRadius: tower.radius,
    falloff: tower.falloff
  });
}

// Projectile physics and collision system
function updateProjectiles() {
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const projectile = gameState.projectiles[i];
    
    // Trail effect generation
    if (projectile.createTrail) {
      projectile.trailCounter++;
      
      if (projectile.trailCounter >= projectile.trailInterval) {
        projectile.trailCounter = 0;
        
        gameState.effects.push({
          type: 'particle',
          x: projectile.x,
          y: projectile.y,
          radius: projectile.size * 0.7,
          color: projectile.color,
          velocity: { x: 0, y: 0 },
          alpha: 0.7,
          lifetime: 10
        });
      }
    }
    
    // Target tracking with dynamic position updates
    if (projectile.target && gameState.enemies.includes(projectile.target)) {
      projectile.targetX = projectile.target.x;
      projectile.targetY = projectile.target.y;
    }
    
    // Trajectory calculation with normalized vectors
    const dx = projectile.targetX - projectile.x;
    const dy = projectile.targetY - projectile.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Collision detection with proximity threshold
    if (distance < 5) {
      // Hit registration with type-specific behavior
      if (projectile.target && gameState.enemies.includes(projectile.target)) {
        if (projectile.type === 'bomber') {
          // Explosion effect
          createExplosion(projectile.targetX, projectile.targetY, projectile.explosionRadius);
          
          // Primary target damage
          projectile.target.health -= projectile.damage;
          
          // Area damage
          for (const enemy of gameState.enemies) {
            if (enemy === projectile.target) continue;
            
            const explosionDx = enemy.x - projectile.targetX;
            const explosionDy = enemy.y - projectile.targetY;
            const explosionDistance = Math.sqrt(explosionDx * explosionDx + explosionDy * explosionDy);
            
            if (explosionDistance <= projectile.explosionRadius) {
              // Calculate damage falloff
              const damagePercent = 1 - (explosionDistance / projectile.explosionRadius) * projectile.falloff;
              const areaDamage = Math.floor(projectile.damage * damagePercent);
              
              if (areaDamage > 0) {
                enemy.health -= areaDamage;
                
                // Damage indicator
                createFloatingText(
                  enemy.x, 
                  enemy.y - 20, 
                  `-${areaDamage}`, 
                  '#ff9999'
                );
                
                // Check for defeat from splash damage
                if (enemy.health <= 0) {
                  defeatEnemy(enemy);
                }
              }
            }
          }
          
          // Check if primary target defeated
          if (projectile.target.health <= 0) {
            defeatEnemy(projectile.target);
          }
        } else {
          // Standard impact with audio feedback
          audioSystem.playSound('hit', { 
            volume: 0.4, 
            rateVariation: 0.2 
          });
          
          projectile.target.health -= projectile.damage;
          
          // Impact effect
          for (let j = 0; j < 6; j++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            
            gameState.effects.push({
              type: 'particle',
              x: projectile.target.x,
              y: projectile.target.y,
              radius: 3,
              color: projectile.color,
              velocity: {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
              },
              alpha: 1,
              lifetime: 15
            });
          }
          
          // Damage text
          createFloatingText(
            projectile.target.x, 
            projectile.target.y - 20, 
            `-${projectile.damage}`, 
            '#ff9999'
          );
          
          // Check for defeat
          if (projectile.target.health <= 0) {
            defeatEnemy(projectile.target);
          }
        }
      }
      
      // Remove projectile
      gameState.projectiles.splice(i, 1);
    } else {
      // Projectile movement with acceleration curve
      const speed = projectile.speed * (1 + 0.1 * (1 - distance / 300));
      projectile.x += (dx / distance) * speed;
      projectile.y += (dy / distance) * speed;
    }
  }
}

// Area effect explosion system with audio-visual synchronization
function createExplosion(x, y, radius) {
  // Explosion audio
  audioSystem.playSound('explosion', {
    volume: 0.7,
    rateVariation: 0.1
  });
  
  // Explosion shockwave
  gameState.effects.push({
    type: 'explosion',
    x: x,
    y: y,
    radius: 5,
    maxRadius: radius,
    color: '#fed7d7',
    alpha: 0.7,
    lifetime: 20
  });
  
  // Explosion flash
  gameState.effects.push({
    type: 'particle',
    x: x,
    y: y,
    radius: radius * 0.4,
    color: 'rgba(255, 255, 255, 0.7)',
    velocity: { x: 0, y: 0 },
    alpha: 0.7,
    lifetime: 5
  });
  
  // Debris particles
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius * 0.8;
    const speed = 1 + Math.random() * 3;
    
    gameState.effects.push({
      type: 'particle',
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      radius: 2 + Math.random() * 2,
      color: Math.random() > 0.5 ? '#f56565' : '#fed7d7',
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      },
      alpha: 0.8,
      lifetime: 15 + Math.random() * 15
    });
  }
  
  // Explosion text
  createFloatingText(
    x, 
    y, 
    'BOOM!', 
    '#f56565'
  );
}

// Enemy defeat processing with audio feedback
function defeatEnemy(enemy) {
  const reward = enemy.reward;
  gameState.money += reward;
  
  // Death effect audio
  if (enemy.type === 'boss') {
    audioSystem.playSound('explosion', { volume: 0.5 });
  } else {
    audioSystem.playSound('hit', { 
      volume: 0.5,
      rateVariation: 0.3
    });
  }
  
  // Death effect particle system
  for (let j = 0; j < 12; j++) {
    const angle = Math.PI * 2 * (j / 12);
    gameState.effects.push({
      type: 'particle',
      x: enemy.x,
      y: enemy.y,
      radius: 4,
      color: enemy.color,
      velocity: {
        x: Math.cos(angle) * 3,
        y: Math.sin(angle) * 3
      },
      alpha: 1,
      lifetime: 20
    });
  }
  
  // Reward visualization
  createFloatingText(
    enemy.x,
    enemy.y - 30,
    `+${reward} gold!`,
    '#f6e05e'
  );
  
  // Remove enemy from active units
  gameState.enemies = gameState.enemies.filter(e => e !== enemy);
  
  // Update interface state
  updateUI();
}

// Effect update system
function updateEffects() {
  for (let i = gameState.effects.length - 1; i >= 0; i--) {
    const effect = gameState.effects[i];
    
    // Temporal decay
    effect.lifetime--;
    
    if (effect.lifetime <= 0) {
      gameState.effects.splice(i, 1);
      continue;
    }
    
    // Explosion expansion
    if (effect.type === 'explosion') {
      effect.radius = effect.radius + (effect.maxRadius - effect.radius) / effect.lifetime;
    }
    
    // Spatial transformation
    if (effect.velocity) {
      effect.x += effect.velocity.x;
      effect.y += effect.velocity.y;
    }
    
    // Opacity decay
    if (effect.alpha) {
      effect.alpha = Math.max(0, effect.alpha - 0.02);
    }
  }
}

// Rendering pipeline orchestration
function render() {
  // Scene foundation
  drawBackground();
  
  // Game element visualization
  drawPath();
  drawTowers();
  drawEnemies();
  drawProjectiles();
  drawEffects();
  drawTowerPreview();
  
  // Grid system visualization
  drawGrid();
  
  // Game state overlays
  if (gameState.preparationPhase && gameState.gameScreen === 'game') {
    // Preparation phase temporal indicator
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(canvas.width / 2 - 120, 10, 240, 40);
    
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#48bb78';
    ctx.textAlign = 'center';
    ctx.fillText(`Preparation: ${gameState.preparationTimer}s`, canvas.width / 2, 35);
  }
}

// Environment visualization
function drawBackground() {
  ctx.fillStyle = '#1a202c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Grid texture application
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  
  const gridSpacing = gameState.gridSize;
  for (let x = 0; x < canvas.width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  
  for (let y = 0; y < canvas.height; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

// Path visualization system
function drawPath() {
  // Path shadow for depth perception
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 44;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();
  
  // Primary path surface
  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 40;
  
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();
  
  // Path interior
  ctx.strokeStyle = '#4a5568';
  ctx.lineWidth = 36;
  
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();
  
  // Path embellishment
  ctx.setLineDash([5, 15]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();
  
  ctx.setLineDash([]);
}

// Tower visualization system
function drawTowers() {
  for (const tower of gameState.towers) {
    // Tower foundation
    ctx.fillStyle = '#2d3748';
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 18, 0, Math.PI * 2);
    ctx.fill();
    
    // Tower perimeter
    ctx.lineWidth = 4;
    ctx.strokeStyle = tower.color;
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 16, 0, Math.PI * 2);
    ctx.stroke();
    
    // Tower core
    ctx.fillStyle = '#4a5568';
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Turret geometry with rotational transformation
    ctx.save();
    ctx.translate(tower.x, tower.y);
    ctx.rotate(tower.angle);
    
    // Type-specific architecture
    ctx.fillStyle = tower.color;
    
    if (tower.type === 'cannon') {
      // Cannon geometry
      ctx.fillRect(0, -6, tower.barrelLength + 5, 12);
      ctx.beginPath();
      ctx.arc(tower.barrelLength + 5, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (tower.type === 'magic') {
      // Arcane geometry
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(8, -8);
      ctx.lineTo(16, 0);
      ctx.lineTo(8, 8);
      ctx.closePath();
      ctx.fill();
      
      // Energy core
      ctx.fillStyle = 'rgba(211, 187, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(8, 0, 4 + Math.sin(Date.now() / 200) * 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (tower.type === 'sniper') {
      // Precision barrel with stabilizing elements
      ctx.fillRect(0, -3, tower.barrelLength + 8, 6);
      
      // Scope visualization
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(4, -6, 8, 12);
      ctx.fillStyle = '#c6f6d5';
      ctx.beginPath();
      ctx.arc(8, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Targeting laser (only when targeting)
      if (tower.target) {
        const targetDistance = Math.sqrt(
          Math.pow(tower.target.x - tower.x, 2) + 
          Math.pow(tower.target.y - tower.y, 2)
        );
        
        ctx.strokeStyle = 'rgba(198, 246, 213, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tower.barrelLength, 0);
        ctx.lineTo(targetDistance, 0);
        ctx.stroke();
      }
    } else if (tower.type === 'bomber') {
      // Heavy ordnance system
      ctx.fillRect(0, -5, tower.barrelLength, 10);
      
      // Ammunition visualization
      ctx.fillStyle = '#fed7d7';
      ctx.beginPath();
      ctx.arc(5, -8, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(5, 8, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Launcher
      ctx.fillStyle = tower.color;
      ctx.beginPath();
      ctx.arc(tower.barrelLength, 0, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Standard configuration
      ctx.fillRect(0, -4, tower.barrelLength + 4, 8);
    }
    
    ctx.restore();
    
    // Range visualization for selected tower
    if (gameState.selectedTower && tower === gameState.towers[gameState.towers.length - 1]) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

// Enemy visualization system
function drawEnemies() {
  for (const enemy of gameState.enemies) {
    // Pulse effect calculation
    const pulseSize = enemy.size * (1 + enemy.pulseEffect * 0.1);
    
    // Shadow for depth perception
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(enemy.x + 2, enemy.y + 2, pulseSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Enemy body
    ctx.fillStyle = enemy.color;
    ctx.strokeStyle = enemy.outlineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, pulseSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Enemy type-specific embellishments
    if (enemy.type === 'fast') {
      // Speed indicators
      ctx.strokeStyle = '#faf089';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(enemy.x - 15, enemy.y);
      ctx.lineTo(enemy.x - 5, enemy.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(enemy.x - 12, enemy.y - 5);
      ctx.lineTo(enemy.x - 2, enemy.y - 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(enemy.x - 12, enemy.y + 5);
      ctx.lineTo(enemy.x - 2, enemy.y + 5);
      ctx.stroke();
    } else if (enemy.type === 'strong') {
      // Armor indicator
      ctx.fillStyle = '#d6bcfa';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, pulseSize / 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (enemy.type === 'boss') {
      // Boss markings
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      
      // Crown symbol
      ctx.beginPath();
      ctx.moveTo(enemy.x - 10, enemy.y - 5);
      ctx.lineTo(enemy.x - 5, enemy.y - 10);
      ctx.lineTo(enemy.x, enemy.y - 5);
      ctx.lineTo(enemy.x + 5, enemy.y - 10);
      ctx.lineTo(enemy.x + 10, enemy.y - 5);
      ctx.stroke();
    }
    
    // Health indicator system
    const healthPercent = enemy.health / enemy.maxHealth;
    const barWidth = enemy.size * 1.2;
    const barHeight = 5;
    
    // Health bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size / 2 - 12, barWidth, barHeight);
    
    // Health bar with color gradient
    let healthColor;
    if (healthPercent > 0.6) {
      healthColor = '#22c55e';
    } else if (healthPercent > 0.3) {
      healthColor = '#ecc94b';
    } else {
      healthColor = '#ef4444';
    }
    
    ctx.fillStyle = healthColor;
    ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size / 2 - 12, barWidth * healthPercent, barHeight);
    
    // Health bar border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(enemy.x - barWidth / 2, enemy.y - enemy.size / 2 - 12, barWidth, barHeight);
  }
}

// Projectile visualization system
function drawProjectiles() {
  for (const projectile of gameState.projectiles) {
    // Shadow for depth perception
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(projectile.x + 2, projectile.y + 2, projectile.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Projectile core
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Luminosity halo
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.size * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = projectile.color;
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Type-specific embellishments
    if (projectile.type === 'magic') {
      // Arcane particles
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      const sparkSize = projectile.size * 1.2;
      
      ctx.beginPath();
      ctx.moveTo(projectile.x - sparkSize, projectile.y);
      ctx.lineTo(projectile.x + sparkSize, projectile.y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(projectile.x, projectile.y - sparkSize);
      ctx.lineTo(projectile.x, projectile.y + sparkSize);
      ctx.stroke();
    } else if (projectile.type === 'bomber') {
      // Bomb visualization
      ctx.fillStyle = '#f56565';
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
      
      // Fuse visualization
      ctx.strokeStyle = '#f6e05e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(projectile.x, projectile.y - projectile.size / 2);
      ctx.lineTo(projectile.x, projectile.y - projectile.size);
      ctx.stroke();
      
      // Spark effect
      ctx.fillStyle = '#f6e05e';
      ctx.beginPath();
      ctx.arc(
        projectile.x + Math.sin(Date.now() / 100) * 2, 
        projectile.y - projectile.size - 2, 
        2, 
        0, 
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}

// Effect rendering system
function drawEffects() {
  for (const effect of gameState.effects) {
    ctx.globalAlpha = effect.alpha || 1;
    
    if (effect.type === 'particle') {
      // Particle visualization
      ctx.fillStyle = effect.color;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (effect.type === 'text') {
      // Text visualization
      ctx.fillStyle = effect.color;
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(effect.text, effect.x, effect.y);
    } else if (effect.type === 'explosion') {
      // Explosive shockwave visualization
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 3 * (effect.lifetime / 20);
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
  }
}

// Tower placement preview system
function drawTowerPreview() {
  if (gameState.selectedTower) {
    // Tower type properties
    const towerData = towerTypes[gameState.selectedTower];
    
    // Grid alignment
    const gridX = Math.floor(gameState.mouseX / gameState.gridSize) * gameState.gridSize;
    const gridY = Math.floor(gameState.mouseY / gameState.gridSize) * gameState.gridSize;
    
    // Placement validation
    const isValid = isPositionValid(gridX, gridY);
    
    // Semi-transparent preview
    ctx.globalAlpha = 0.6;
    
    // Tower base
    ctx.fillStyle = isValid ? '#2d3748' : '#9b2c2c';
    ctx.beginPath();
    ctx.arc(gridX, gridY, 18, 0, Math.PI * 2);
    ctx.fill();
    
    // Tower perimeter
    ctx.strokeStyle = isValid ? towerData.color : '#fc8181';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(gridX, gridY, 16, 0, Math.PI * 2);
    ctx.stroke();
    
    // Range indicator
    ctx.strokeStyle = isValid ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 100, 100, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(gridX, gridY, towerData.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Cost indicator
    ctx.fillStyle = gameState.money >= towerData.cost ? '#48bb78' : '#e53e3e';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`$${towerData.cost}`, gridX, gridY - 30);
    
    ctx.globalAlpha = 1;
  }
}

// Grid visualization system
function drawGrid() {
  // Only show enhanced grid during placement phase
  if (!gameState.selectedTower) return;
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  
  for (let x = 0; x < canvas.width; x += gameState.gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  
  for (let y = 0; y < canvas.height; y += gameState.gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

// Game termination system with audio transition
function gameOver(reason = "Game Over") {
  gameState.isPlaying = false;
  
  // Dramatic audio transition
  audioSystem.stopMusic(1.5); // 1.5 second fade out
  audioSystem.playSound('game-over', { volume: 0.8 });
  
  // Termination notification interface
  const gameOverDiv = document.createElement('div');
  gameOverDiv.className = 'game-over';
  gameOverDiv.innerHTML = `
    <h2>${reason}</h2>
    <p>You survived ${gameState.wave} waves</p>
    <button id="restart-button">Play Again</button>
  `;
  
  document.body.appendChild(gameOverDiv);
  
  // Interface styling
  const style = document.createElement('style');
  style.textContent = `
    .game-over {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 100;
      color: white;
    }
    
    .game-over h2 {
      font-size: 48px;
      margin-bottom: 20px;
      color: #ef4444;
    }
    
    .game-over p {
      font-size: 24px;
      margin-bottom: 30px;
    }
    
    #restart-button {
      padding: 12px 24px;
      font-size: 18px;
      background-color: #48bb78;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    #restart-button:hover {
      background-color: #38a169;
    }
  `;
  document.head.appendChild(style);
  
  // Restart functionality
  document.getElementById('restart-button').addEventListener('click', () => {
    document.body.removeChild(gameOverDiv);
    resetGame();
    gameState.gameScreen = 'mainMenu';
    createMainMenu();
    uiElements.startScreen.style.display = 'flex';
  });
}

// Game state reset system
function resetGame() {
  gameState.money = 75;
  gameState.lives = 1;
  gameState.wave = 1;
  gameState.towers = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.effects = [];
  gameState.selectedTower = null;
  gameState.difficultyFactor = 1.0;
  gameState.waveCompleted = false;
  gameState.unlockedTowers = ['basic'];
  gameState.waveStarted = false;
  
  // Clear timers to prevent memory leaks
  if (gameState.enemySpawnInterval) {
    clearInterval(gameState.enemySpawnInterval);
    gameState.enemySpawnInterval = null;
  }
  
  if (gameState.waveTimeout) {
    clearTimeout(gameState.waveTimeout);
    gameState.waveTimeout = null;
  }
  
  const uiContainer = document.getElementById('ui-container');
  if (uiContainer) {
    uiContainer.style.display = 'none';
  }
  
  // Stop music
  audioSystem.stopMusic(0.5);
  
  updateUI();
}

// Tower technology availability system
function updateTowerAvailability() {
  // Update tower button states based on game progression
  const towerButtons = document.querySelectorAll('.tower-button');
  
  towerButtons.forEach(button => {
    const towerType = button.dataset.type;
    const unlockWave = parseInt(button.dataset.unlockWave);
    const towerData = towerTypes[towerType];
    
    // Determine if tower is available
    const isUnlocked = gameState.wave >= unlockWave;
    const isAffordable = gameState.money >= towerData.cost;
    
    // Visual state update
    button.disabled = !isUnlocked || !isAffordable;
    
    // Track newly unlocked technologies
    if (isUnlocked && !gameState.unlockedTowers.includes(towerType)) {
      gameState.unlockedTowers.push(towerType);
      
      // Notification for newly unlocked tower
      if (gameState.isPlaying) {
        audioSystem.playSound('upgrade');
        createFloatingText(
          canvas.width / 2,
          canvas.height / 2 - 50,
          `New Tower Unlocked: ${towerData.name}!`,
          '#f6e05e'
        );
      }
    }
  });
}

// Interface state synchronization
function updateUI() {
  // Update resource displays
  const moneyElement = document.getElementById('money');
  const waveElement = document.getElementById('wave-number');
  const livesElement = document.getElementById('lives-count');
  
  if (moneyElement) moneyElement.textContent = gameState.money;
  if (waveElement) waveElement.textContent = gameState.wave;
  if (livesElement) livesElement.textContent = gameState.lives;
  
  // Update tower availability
  updateTowerAvailability();
}

// Main execution loop
function gameLoop() {
  if (gameState.gameScreen === 'game' && gameState.isPlaying) {
    update();
  }
  render();
  requestAnimationFrame(gameLoop);
}

// Application initialization and execution
window.onload = function() {
  init();
  gameLoop();
};