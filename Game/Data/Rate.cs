namespace FarmToStars.Data
{
    /// <summary>
    /// Production rate definition (amount per second).
    /// </summary>
    public sealed record Rate
    {
        public string ResourceId { get; init; } = string.Empty;
        public float AmountPerSecond { get; init; }
    }
}

