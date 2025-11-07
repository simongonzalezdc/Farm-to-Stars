namespace FarmToStars
{
    /// <summary>
    /// Manages the current game phase and phase transitions.
    /// </summary>
    public enum GamePhase
    {
        Homestead,
        Township,
        Nation,
        Stellar
    }

    /// <summary>
    /// Manages the current game phase and phase transitions.
    /// </summary>
    public sealed class PhaseManager
    {
        /// <summary>
        /// Current game phase.
        /// </summary>
        public GamePhase CurrentPhase { get; private set; } = GamePhase.Homestead;

        /// <summary>
        /// Changes to the specified phase.
        /// </summary>
        public void SetPhase(GamePhase phase)
        {
            CurrentPhase = phase;
        }
    }
}

