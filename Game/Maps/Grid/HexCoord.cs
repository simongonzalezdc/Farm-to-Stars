using System;
using System.Collections.Generic;
using System.Linq;

namespace FarmToStars.Maps.Grid
{
    /// <summary>
    /// Axial hex coordinate (q, r) for pointy-top hexagons.
    /// </summary>
    public readonly record struct HexCoord(int Q, int R)
    {
        /// <summary>
        /// Third coordinate in cube space (s = -q - r).
        /// </summary>
        public int S => -Q - R;

        /// <summary>
        /// Gets the 6 neighbors of this hex coordinate.
        /// </summary>
        public IEnumerable<HexCoord> Neighbors()
        {
            // Pointy-top hex neighbors
            yield return new HexCoord(Q + 1, R);     // East
            yield return new HexCoord(Q + 1, R - 1); // Northeast
            yield return new HexCoord(Q, R - 1);     // Northwest
            yield return new HexCoord(Q - 1, R);     // West
            yield return new HexCoord(Q - 1, R + 1); // Southwest
            yield return new HexCoord(Q, R + 1);     // Southeast
        }

        /// <summary>
        /// Calculates axial distance between two hex coordinates.
        /// </summary>
        public static int Distance(HexCoord a, HexCoord b)
        {
            return (Math.Abs(a.Q - b.Q) + Math.Abs(a.Q + a.R - b.Q - b.R) + Math.Abs(a.R - b.R)) / 2;
        }

        /// <summary>
        /// Calculates distance from this hex to another.
        /// </summary>
        public int DistanceTo(HexCoord other) => Distance(this, other);
    }
}

