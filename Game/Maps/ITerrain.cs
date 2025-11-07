namespace FarmToStars.Maps
{
    /// <summary>
    /// Terrain properties for pathfinding and gameplay.
    /// </summary>
    public interface ITerrain
    {
        /// <summary>
        /// Movement cost for units (1 = normal, higher = slower).
        /// </summary>
        int MoveCost { get; }

        /// <summary>
        /// Whether this terrain is impassable.
        /// </summary>
        bool Impassable { get; }

        /// <summary>
        /// Terrain type identifier.
        /// </summary>
        string Type { get; }
    }
}

