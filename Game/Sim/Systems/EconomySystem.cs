using System;
using System.Linq;
using DefaultEcs;
using DefaultEcs.System;
using FarmToStars.ECS;

namespace FarmToStars.Sim.Systems
{
    /// <summary>
    /// Handles production: consumes inputs, advances progress, produces outputs.
    /// </summary>
    public sealed class EconomySystem : AEntitySetSystem<TimeSpan>
    {
        public EconomySystem(World world)
            : base(world.GetEntities().With<Production>().With<Storage>().AsSet())
        {
        }

        protected override void Update(TimeSpan state, in Entity entity)
        {
            ref var production = ref entity.Get<Production>();
            ref var storage = ref entity.Get<Storage>();

            if (production.Inputs == null || production.Outputs == null || storage.Items == null)
                return;

            // Check if inputs are available
            bool canProduce = true;
            foreach (var input in production.Inputs)
            {
                var stack = storage.Items.FirstOrDefault(s => s.ResourceId == input.ResourceId);
                if (stack.Amount < input.AmountPerSecond * (float)state.TotalSeconds)
                {
                    canProduce = false;
                    break;
                }
            }

            if (!canProduce)
                return;

            // Consume inputs
            foreach (var input in production.Inputs)
            {
                var stackIndex = Array.FindIndex(storage.Items, s => s.ResourceId == input.ResourceId);
                if (stackIndex >= 0)
                {
                    var consumed = (int)(input.AmountPerSecond * (float)state.TotalSeconds);
                    var stack = storage.Items[stackIndex];
                    storage.Items[stackIndex] = stack with { Amount = Math.Max(0, stack.Amount - consumed) };
                }
            }

            // Advance progress
            production.Progress += (float)state.TotalSeconds;

            // Produce outputs when progress reaches 1.0
            if (production.Progress >= 1.0f)
            {
                production.Progress = 0f;

                foreach (var output in production.Outputs)
                {
                    var stackIndex = Array.FindIndex(storage.Items, s => s.ResourceId == output.ResourceId);
                    if (stackIndex >= 0)
                    {
                        var produced = (int)output.AmountPerSecond;
                        var stack = storage.Items[stackIndex];
                        var newAmount = Math.Min(stack.Max, stack.Amount + produced);
                        storage.Items[stackIndex] = stack with { Amount = newAmount };
                    }
                }
            }
        }
    }
}

