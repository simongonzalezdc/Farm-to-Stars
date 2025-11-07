using System.Collections.Generic;

namespace FarmToStars.Data
{
    /// <summary>
    /// Building data definition.
    /// </summary>
    public sealed record Building
    {
        public int SchemaVersion { get; init; } = 1;
        public string Id { get; init; } = string.Empty;
        public string Phase { get; init; } = string.Empty;
        public int[] Size { get; init; } = { 1, 1 };
        public Dictionary<string, int> BuildCost { get; init; } = new();
        public Dictionary<string, int> Upkeep { get; init; } = new();
        public Dictionary<string, int> Inputs { get; init; } = new();
        public Dictionary<string, int> Outputs { get; init; } = new();
        public List<Effect> Effects { get; init; } = new();
        public int Workers { get; init; } = 0;
        public SpriteData? Sprite { get; init; }
    }

    /// <summary>
    /// Building effect definition.
    /// </summary>
    public sealed record Effect
    {
        public string Type { get; init; } = string.Empty;
        public float Amount { get; init; }
        public int Radius { get; init; }
    }

    /// <summary>
    /// Sprite data definition.
    /// </summary>
    public sealed record SpriteData
    {
        public string Sheet { get; init; } = string.Empty;
        public int[] Src { get; init; } = { 0, 0, 32, 32 };
    }
}

