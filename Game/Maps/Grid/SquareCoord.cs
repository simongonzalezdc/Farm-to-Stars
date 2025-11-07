using System.Collections.Generic;
using System.Linq;
using Microsoft.Xna.Framework;

namespace FarmToStars.Maps.Grid
{
    /// <summary>
    /// Square grid coordinate utilities.
    /// </summary>
    public static class SquareCoord
    {
        /// <summary>
        /// Gets the 4-directional neighbors (N, E, S, W) of a square tile.
        /// </summary>
        public static IEnumerable<Point> Neighbors4(Point tile)
        {
            yield return new Point(tile.X, tile.Y - 1); // North
            yield return new Point(tile.X + 1, tile.Y); // East
            yield return new Point(tile.X, tile.Y + 1); // South
            yield return new Point(tile.X - 1, tile.Y); // West
        }

        /// <summary>
        /// Gets the 8-directional neighbors (including diagonals) of a square tile.
        /// </summary>
        public static IEnumerable<Point> Neighbors8(Point tile)
        {
            for (int dx = -1; dx <= 1; dx++)
            {
                for (int dy = -1; dy <= 1; dy++)
                {
                    if (dx == 0 && dy == 0) continue;
                    yield return new Point(tile.X + dx, tile.Y + dy);
                }
            }
        }

        /// <summary>
        /// Calculates Manhattan distance between two square tiles.
        /// </summary>
        public static int ManhattanDistance(Point a, Point b)
        {
            return System.Math.Abs(a.X - b.X) + System.Math.Abs(a.Y - b.Y);
        }

        /// <summary>
        /// Calculates Chebyshev distance (max of dx, dy) between two square tiles.
        /// </summary>
        public static int ChebyshevDistance(Point a, Point b)
        {
            return System.Math.Max(System.Math.Abs(a.X - b.X), System.Math.Abs(a.Y - b.Y));
        }
    }
}

