using System;

namespace FarmToStars.Sim
{
    /// <summary>
    /// Fixed-step simulation clock running at 20 Hz (50ms per step).
    /// </summary>
    public sealed class SimClock
    {
        /// <summary>
        /// Fixed simulation step duration (50ms = 20 Hz).
        /// </summary>
        public static readonly TimeSpan Step = TimeSpan.FromMilliseconds(50);

        /// <summary>
        /// Accumulated elapsed time waiting to be consumed.
        /// </summary>
        public TimeSpan Accumulator { get; private set; }

        /// <summary>
        /// Adds elapsed time to the accumulator.
        /// </summary>
        public void AddElapsed(TimeSpan dt) => Accumulator += dt;

        /// <summary>
        /// Returns true if a simulation step should be executed.
        /// </summary>
        public bool ShouldStep() => Accumulator >= Step;

        /// <summary>
        /// Consumes one fixed step from the accumulator.
        /// </summary>
        public void ConsumeStep() => Accumulator -= Step;
    }
}

