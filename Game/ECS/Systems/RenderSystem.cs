using DefaultEcs;
using DefaultEcs.System;
using FarmToStars.ECS;
using FarmToStars.Util;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;

namespace FarmToStars.ECS.Systems
{
    /// <summary>
    /// Renders entities with Sprite and Transform components.
    /// </summary>
    public sealed class RenderSystem : AEntitySetSystem<float>
    {
        private readonly SpriteBatch _spriteBatch;
        private readonly Camera2D _camera;
        private Matrix _viewMatrix;

        public RenderSystem(World world, SpriteBatch spriteBatch, Camera2D camera)
            : base(world.GetEntities().With<Sprite>().With<Transform>().AsSet())
        {
            _spriteBatch = spriteBatch;
            _camera = camera;
        }

        public void Begin()
        {
            _viewMatrix = _camera.GetViewMatrix(
                _spriteBatch.GraphicsDevice.Viewport.Width,
                _spriteBatch.GraphicsDevice.Viewport.Height
            );

            _spriteBatch.Begin(
                transformMatrix: _viewMatrix,
                samplerState: SamplerState.PointClamp
            );
        }

        public void End()
        {
            _spriteBatch.End();
        }

        protected override void Update(float state, in Entity entity)
        {
            ref var transform = ref entity.Get<Transform>();
            ref var sprite = ref entity.Get<Sprite>();

            if (sprite.Tex == null)
                return;

            _spriteBatch.Draw(
                sprite.Tex,
                transform.Pos,
                sprite.Src,
                Color.White,
                transform.Rot,
                sprite.Origin,
                Vector2.One,
                SpriteEffects.None,
                0f
            );
        }
    }
}

