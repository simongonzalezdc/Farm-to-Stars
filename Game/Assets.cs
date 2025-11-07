using Microsoft.Xna.Framework.Content;
using Microsoft.Xna.Framework.Graphics;

namespace FarmToStars
{
    /// <summary>
    /// Centralized asset loading and management.
    /// </summary>
    public static class Assets
    {
        private static ContentManager? _content;

        /// <summary>
        /// Default font spritefont.
        /// </summary>
        public static SpriteFont? Font { get; private set; }

        /// <summary>
        /// Initializes asset loading with the provided content manager.
        /// </summary>
        public static void Initialize(ContentManager content)
        {
            _content = content;
        }

        /// <summary>
        /// Loads all game assets.
        /// </summary>
        public static void LoadContent()
        {
            if (_content == null)
                return;

            try
            {
                Font = _content.Load<SpriteFont>("font");
            }
            catch
            {
                // Font not built yet - will use fallback rendering
                Font = null;
            }
        }
    }
}

