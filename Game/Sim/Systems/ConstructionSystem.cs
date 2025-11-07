using System;
using DefaultEcs;
using DefaultEcs.System;
using FarmToStars.ECS;

namespace FarmToStars.Sim.Systems
{
    /// <summary>
    /// Handles construction: decrements remaining time, spawns building when complete.
    /// </summary>
    public sealed class ConstructionSystem : AEntitySetSystem<TimeSpan>
    {
        private readonly World _world;

        public ConstructionSystem(World world)
            : base(world.GetEntities().With<Construction>().With<Transform>().AsSet())
        {
            _world = world;
        }

        protected override void Update(TimeSpan state, in Entity entity)
        {
            ref var construction = ref entity.Get<Construction>();
            ref var transform = ref entity.Get<Transform>();

            construction.Remaining -= state;

            if (construction.Remaining <= TimeSpan.Zero)
            {
                // Construction complete - replace with building
                var buildingEntity = _world.CreateEntity();
                buildingEntity.Set(transform);
                buildingEntity.Set(new BuildingTag { Id = construction.BuildingId });

                // Remove construction component
                entity.Remove<Construction>();
            }
        }
    }
}

