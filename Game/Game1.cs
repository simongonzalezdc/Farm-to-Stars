using System;
using DefaultEcs;
using DefaultEcs.System;
using FarmToStars.ECS;
using FarmToStars.ECS.Systems;
using FarmToStars.Maps;
using FarmToStars.Sim;
using FarmToStars.Sim.Systems;
using FarmToStars.Util;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;
using Myra;
using Myra.Graphics2D.UI;
using Myra.Graphics2D.Brushes;

namespace FarmToStars
{
    /// <summary>
    /// Main game class implementing fixed-step simulation and rendering.
    /// </summary>
    public class Game1 : Game
    {
        private GraphicsDeviceManager _graphics;
        private SpriteBatch _spriteBatch;
        private SimClock _simClock;
        private PhaseManager _phaseManager;
        private Desktop _myraDesktop;
        private Panel _placeholderPanel;

        // ECS
        private World _world;
        private ISystem<float> _renderSystem;
        private ISystem<float> _movementSystem;
        private ISystem<TimeSpan> _economySystem;
        private ISystem<TimeSpan> _constructionSystem;

        // Map and Camera
        private IMap _currentMap;
        private Camera2D _camera;
        private KeyboardState _previousKeyboardState;
        private MouseState _previousMouseState;
        private Texture2D _pixelTexture;

        public Game1()
        {
            _graphics = new GraphicsDeviceManager(this);
            Content.RootDirectory = "Content";
            IsMouseVisible = true;
            TargetElapsedTime = TimeSpan.FromSeconds(1.0 / 60.0); // 60 FPS
            IsFixedTimeStep = true;

            _simClock = new SimClock();
            _phaseManager = new PhaseManager();
        }

        protected override void Initialize()
        {
            base.Initialize();

            // Set window size
            _graphics.PreferredBackBufferWidth = 1280;
            _graphics.PreferredBackBufferHeight = 720;
            _graphics.ApplyChanges();

            // Initialize ECS
            _world = new World();

            // Initialize camera
            _camera = new Camera2D();
            _camera.Position = new Vector2(3200, 3200); // Center of 200x200 map at 32px tiles

            // Initialize map
            _currentMap = new FarmMap();

            // Systems will be initialized after LoadContent when _spriteBatch is ready
            _movementSystem = new MovementSystem(_world);
            _economySystem = new EconomySystem(_world);
            _constructionSystem = new ConstructionSystem(_world);

            // Initialize Myra
            MyraEnvironment.Game = this;
            _myraDesktop = new Desktop();

            // Create placeholder panel
            var blueColor = Color.Blue;
            blueColor.A = (byte)(255 * 0.3f);
            _placeholderPanel = new Panel
            {
                Background = new SolidBrush(blueColor),
                Left = 10,
                Top = 10,
                Width = 250,
                Height = 150
            };

            var label = new Label
            {
                Text = "Farm to Stars\nPhase: " + _phaseManager.CurrentPhase + "\n\nWASD: Move Camera\nMouse: Pan",
                TextColor = Color.White
            };
            _placeholderPanel.Widgets.Add(label);
            _myraDesktop.Root = _placeholderPanel;

            _previousKeyboardState = Keyboard.GetState();
            _previousMouseState = Mouse.GetState();
        }

        protected override void LoadContent()
        {
            _spriteBatch = new SpriteBatch(GraphicsDevice);
            Assets.Initialize(Content);
            Assets.LoadContent();

            // Initialize render system now that spriteBatch is ready
            _renderSystem = new RenderSystem(_world, _spriteBatch, _camera);

            // Create a simple white texture for testing
            var whiteTexture = new Texture2D(GraphicsDevice, 1, 1);
            whiteTexture.SetData(new[] { Color.White });

            // Create pixel texture for grid
            _pixelTexture = new Texture2D(GraphicsDevice, 1, 1);
            _pixelTexture.SetData(new[] { Color.White });

            // Create test entities
            CreateTestEntities(whiteTexture);
        }

        private void CreateTestEntities(Texture2D texture)
        {
            // Create a test entity with sprite and transform
            var testEntity = _world.CreateEntity();
            testEntity.Set(new Transform
            {
                Pos = new Vector2(3200, 3200),
                Rot = 0f
            });
            testEntity.Set(new Sprite
            {
                Tex = texture,
                Src = new Rectangle(0, 0, 32, 32),
                Origin = new Vector2(16, 16)
            });

            // Create a test entity with movement
            var movingEntity = _world.CreateEntity();
            movingEntity.Set(new Transform
            {
                Pos = new Vector2(3100, 3100),
                Rot = 0f
            });
            movingEntity.Set(new Sprite
            {
                Tex = texture,
                Src = new Rectangle(0, 0, 32, 32),
                Origin = new Vector2(16, 16)
            });
            movingEntity.Set(new Orders
            {
                Queue = new System.Collections.Queue<Order>()
            });
            var orders = movingEntity.Get<Orders>();
            orders.Queue.Enqueue(new Order(OrderKind.MoveToTile, 100, 100));
            movingEntity.Set(orders);

            // Create a test production entity
            var productionEntity = _world.CreateEntity();
            productionEntity.Set(new Transform
            {
                Pos = new Vector2(3300, 3300),
                Rot = 0f
            });
            productionEntity.Set(new Sprite
            {
                Tex = texture,
                Src = new Rectangle(0, 0, 32, 32),
                Origin = new Vector2(16, 16)
            });
            productionEntity.Set(new Production
            {
                Inputs = new[]
                {
                    new ProductionRate("coal", 4f)
                },
                Outputs = new[]
                {
                    new ProductionRate("power", 40f)
                },
                Progress = 0f
            });
            productionEntity.Set(new Storage
            {
                Items = new[]
                {
                    new ResourceStack("coal", 100, 1000),
                    new ResourceStack("power", 0, 1000)
                }
            });
        }

        protected override void Update(GameTime gameTime)
        {
            // Handle input
            HandleInput();

            // Add elapsed time to simulation clock
            _simClock.AddElapsed(gameTime.ElapsedGameTime);

            // Run fixed-step simulation
            while (_simClock.ShouldStep())
            {
                _simClock.ConsumeStep();
                UpdateSimulation();
            }

            // Update Myra UI
            _myraDesktop.Update();

            base.Update(gameTime);
        }

        private void HandleInput()
        {
            var keyboardState = Keyboard.GetState();
            var mouseState = Mouse.GetState();

            // Camera movement with WASD
            float moveSpeed = 200f; // pixels per second
            var moveVector = Vector2.Zero;

            if (keyboardState.IsKeyDown(Keys.W))
                moveVector.Y -= moveSpeed;
            if (keyboardState.IsKeyDown(Keys.S))
                moveVector.Y += moveSpeed;
            if (keyboardState.IsKeyDown(Keys.A))
                moveVector.X -= moveSpeed;
            if (keyboardState.IsKeyDown(Keys.D))
                moveVector.X += moveSpeed;

            // Apply movement based on elapsed time
            var elapsed = (float)TargetElapsedTime.TotalSeconds;
            _camera.Position += moveVector * elapsed;

            // Zoom with mouse wheel
            if (mouseState.ScrollWheelValue != _previousMouseState.ScrollWheelValue)
            {
                var delta = mouseState.ScrollWheelValue - _previousMouseState.ScrollWheelValue;
                _camera.Zoom += delta * 0.001f;
            }

            _previousKeyboardState = keyboardState;
            _previousMouseState = mouseState;
        }

        private void UpdateSimulation()
        {
            // Fixed-step simulation at 20 Hz (50ms per step)
            var stepTime = SimClock.Step;

            // Update systems
            _movementSystem.Update((float)stepTime.TotalSeconds);
            _economySystem.Update(stepTime);
            _constructionSystem.Update(stepTime);
        }

        protected override void Draw(GameTime gameTime)
        {
            GraphicsDevice.Clear(Color.DarkGreen);

            // Draw map grid (simple visualization)
            DrawMapGrid();

            // Draw entities
            if (_renderSystem is RenderSystem renderSys)
            {
                renderSys.Begin();
                _renderSystem.Update((float)gameTime.ElapsedGameTime.TotalSeconds);
                renderSys.End();
            }

            // Draw UI overlay
            _spriteBatch.Begin();

            // Draw FPS counter (with fallback if font not loaded)
            var fps = 1.0f / (float)gameTime.ElapsedGameTime.TotalSeconds;
            if (Assets.Font != null)
            {
                _spriteBatch.DrawString(Assets.Font, $"FPS: {fps:F1}", new Vector2(10, GraphicsDevice.Viewport.Height - 30), Color.White);
                _spriteBatch.DrawString(Assets.Font, $"Camera: ({_camera.Position.X:F0}, {_camera.Position.Y:F0})", new Vector2(10, GraphicsDevice.Viewport.Height - 50), Color.White);
            }
            else
            {
                // Fallback: Draw simple text using a basic texture (or skip text rendering)
                // For now, we'll just skip text if font isn't loaded
            }

            _spriteBatch.End();

            // Draw Myra UI
            _myraDesktop.Render();

            base.Draw(gameTime);
        }

        private void DrawMapGrid()
        {
            // Draw a simple grid visualization
            _spriteBatch.Begin(
                transformMatrix: _camera.GetViewMatrix(
                    GraphicsDevice.Viewport.Width,
                    GraphicsDevice.Viewport.Height
                ),
                samplerState: SamplerState.PointClamp
            );

            // Draw grid lines (simple visualization)
            var viewBounds = GetViewBounds();
            int tileSize = 32;

            int startX = (int)(viewBounds.Left / tileSize) * tileSize;
            int endX = (int)(viewBounds.Right / tileSize) * tileSize;
            int startY = (int)(viewBounds.Top / tileSize) * tileSize;
            int endY = (int)(viewBounds.Bottom / tileSize) * tileSize;

            // Draw vertical lines
            for (int x = startX; x <= endX; x += tileSize)
            {
                _spriteBatch.Draw(_pixelTexture, new Rectangle(x, startY, 1, endY - startY), Color.Gray * 0.3f);
            }

            // Draw horizontal lines
            for (int y = startY; y <= endY; y += tileSize)
            {
                _spriteBatch.Draw(_pixelTexture, new Rectangle(startX, y, endX - startX, 1), Color.Gray * 0.3f);
            }

            _spriteBatch.End();
        }

        private RectangleF GetViewBounds()
        {
            var center = _camera.Position;
            var halfWidth = GraphicsDevice.Viewport.Width / _camera.Zoom;
            var halfHeight = GraphicsDevice.Viewport.Height / _camera.Zoom;
            return new MonoGame.Extended.RectangleF(
                center.X - halfWidth,
                center.Y - halfHeight,
                halfWidth * 2,
                halfHeight * 2
            );
        }

        protected override void UnloadContent()
        {
            _world?.Dispose();
            base.UnloadContent();
        }
    }
}
