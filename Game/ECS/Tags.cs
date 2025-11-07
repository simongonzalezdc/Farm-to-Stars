namespace FarmToStars.ECS
{
    /// <summary>
    /// Tag component for player entities.
    /// </summary>
    public struct PlayerTag { }

    /// <summary>
    /// Tag component for city entities.
    /// </summary>
    public struct CityTag { }

    /// <summary>
    /// Tag component for farm field entities.
    /// </summary>
    public struct FarmFieldTag { }

    /// <summary>
    /// Tag component for building entities.
    /// </summary>
    public struct BuildingTag
    {
        public string Id;
    }

    /// <summary>
    /// Tag component for unit entities.
    /// </summary>
    public struct UnitTag
    {
        public string Id;
    }
}

