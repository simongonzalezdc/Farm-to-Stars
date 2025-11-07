namespace FarmToStars.Maps
{
    /// <summary>
    /// Basic terrain implementation.
    /// </summary>
    public sealed class BasicTerrain : ITerrain
    {
        public int MoveCost { get; }
        public bool Impassable { get; }
        public string Type { get; }

        public BasicTerrain(string type, int moveCost = 1, bool impassable = false)
        {
            Type = type;
            MoveCost = moveCost;
            Impassable = impassable;
        }
    }
}

