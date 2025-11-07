namespace FarmToStars.Data
{
    /// <summary>
    /// Resource data definition.
    /// </summary>
    public sealed record Resource
    {
        public int SchemaVersion { get; init; } = 1;
        public string Id { get; init; } = string.Empty;
        public string Display { get; init; } = string.Empty;
        public int Stack { get; init; } = 9999;
    }
}

