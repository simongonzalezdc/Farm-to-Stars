using Microsoft.Xna.Framework;
using MonoGame.Extended;

namespace FarmToStars.Util
{
    /// <summary>
    /// 2D camera for viewport management.
    /// </summary>
    public class Camera2D
    {
        private Vector2 _position;
        private float _zoom = 1.0f;
        private float _rotation = 0.0f;

        /// <summary>
        /// Camera position in world space.
        /// </summary>
        public Vector2 Position
        {
            get => _position;
            set => _position = value;
        }

        /// <summary>
        /// Camera zoom level (1.0 = normal, >1.0 = zoomed in, <1.0 = zoomed out).
        /// </summary>
        public float Zoom
        {
            get => _zoom;
            set => _zoom = MathHelper.Clamp(value, 0.1f, 5.0f);
        }

        /// <summary>
        /// Camera rotation in radians.
        /// </summary>
        public float Rotation
        {
            get => _rotation;
            set => _rotation = value;
        }

        /// <summary>
        /// Gets the view matrix for this camera.
        /// </summary>
        public Matrix GetViewMatrix(int viewportWidth, int viewportHeight)
        {
            return Matrix.CreateTranslation(-_position.X, -_position.Y, 0) *
                   Matrix.CreateRotationZ(_rotation) *
                   Matrix.CreateScale(_zoom, _zoom, 1) *
                   Matrix.CreateTranslation(viewportWidth * 0.5f, viewportHeight * 0.5f, 0);
        }

        /// <summary>
        /// Converts screen coordinates to world coordinates.
        /// </summary>
        public Vector2 ScreenToWorld(Vector2 screenPos, int viewportWidth, int viewportHeight)
        {
            var matrix = Matrix.Invert(GetViewMatrix(viewportWidth, viewportHeight));
            return Vector2.Transform(screenPos, matrix);
        }

        /// <summary>
        /// Converts world coordinates to screen coordinates.
        /// </summary>
        public Vector2 WorldToScreen(Vector2 worldPos, int viewportWidth, int viewportHeight)
        {
            return Vector2.Transform(worldPos, GetViewMatrix(viewportWidth, viewportHeight));
        }
    }
}

