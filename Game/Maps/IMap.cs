using System.Collections.Generic;
using FarmToStars.Maps.Grid;
using Microsoft.Xna.Framework;
using MonoGame.Extended;

namespace FarmToStars.Maps
{
    /// <summary>
    /// Abstract map interface supporting both square and hex grids.
    /// </summary>
    public interface IMap
    {
        /// <summary>
        /// World bounds in pixels.
        /// </summary>
        RectangleF BoundsWorld { get; }

        /// <summary>
        /// Gets square tiles visible in the camera view (for square maps).
        /// </summary>
        IEnumerable<Point> TilesInView(Camera2D cam);

        /// <summary>
        /// Gets hex coordinates visible in the camera view (for hex maps).
        /// </summary>
        IEnumerable<HexCoord> HexesInView(Camera2D cam);

        /// <summary>
        /// Gets terrain at a square tile coordinate.
        /// </summary>
        ITerrain GetTerrain(int x, int y);

        /// <summary>
        /// Gets terrain at a hex coordinate.
        /// </summary>
        ITerrain GetTerrain(HexCoord hex);

        /// <summary>
        /// Gets neighbors of a square tile.
        /// </summary>
        IEnumerable<Point> Neighbors(Point t);

        /// <summary>
        /// Gets neighbors of a hex coordinate.
        /// </summary>
        IEnumerable<HexCoord> Neighbors(HexCoord h);

        /// <summary>
        /// Converts square tile coordinate to world center position.
        /// </summary>
        Vector2 ToWorldCenter(Point t);

        /// <summary>
        /// Converts hex coordinate to world center position.
        /// </summary>
        Vector2 ToWorldCenter(HexCoord h);
    }
}

