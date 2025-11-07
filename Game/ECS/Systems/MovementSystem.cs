using DefaultEcs;
using DefaultEcs.System;
using FarmToStars.ECS;
using Microsoft.Xna.Framework;

namespace FarmToStars.ECS.Systems
{
    /// <summary>
    /// Moves entities with Transform and Orders components.
    /// </summary>
    public sealed class MovementSystem : AEntitySetSystem<float>
    {
        private const float MoveSpeed = 100f; // pixels per second

        public MovementSystem(World world)
            : base(world.GetEntities().With<Transform>().With<Orders>().AsSet())
        {
        }

        protected override void Update(float state, in Entity entity)
        {
            ref var transform = ref entity.Get<Transform>();
            ref var orders = ref entity.Get<Orders>();

            if (orders.Queue == null || orders.Queue.Count == 0)
                return;

            var order = orders.Queue.Peek();
            if (order.Kind != OrderKind.MoveToTile)
                return;

            var targetPos = new Vector2(order.X * 32f + 16f, order.Y * 32f + 16f);
            var direction = targetPos - transform.Pos;
            var distance = direction.Length();

            if (distance < 1f)
            {
                // Reached target, remove order
                orders.Queue.Dequeue();
                return;
            }

            // Move towards target
            direction.Normalize();
            var moveDistance = MoveSpeed * state;
            if (moveDistance > distance)
                moveDistance = distance;

            transform.Pos += direction * moveDistance;
        }
    }
}

