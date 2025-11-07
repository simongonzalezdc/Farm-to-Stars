using System.Collections.Generic;
using System.Linq;
using FarmToStars.Maps.Grid;
using FarmToStars.Util;
using Microsoft.Xna.Framework;
using MonoGame.Extended;

namespace FarmToStars.Maps
{
    /// <summary>
    /// Hex grid map for Nation phase (axial coordinates).
    /// </summary>
    public sealed class HexMap : IMap
    {
        private const float HexSize = 32f;
        private readonly Dictionary<HexCoord, ITerrain> _terrain;

        public RectangleF BoundsWorld { get; }

        public HexMap(int radius = 50)
        {
            _terrain = new Dictionary<HexCoord, ITerrain>();
            InitializeTerrain(radius);
            BoundsWorld = CalculateBounds(radius);
        }

        private void InitializeTerrain(int radius)
        {
            for (int q = -radius; q <= radius; q++)
            {
                int r1 = System.Math.Max(-radius, -q - radius);
                int r2 = System.Math.Min(radius, -q + radius);
                for (int r = r1; r <= r2; r++)
                {
                    var hex = new HexCoord(q, r);
                    _terrain[hex] = new BasicTerrain("plain", 1, false);
                }
            }
        }

        private RectangleF CalculateBounds(int radius)
        {
            float width = HexSize * 2 * radius * 1.5f;
            float height = HexSize * 2 * radius * System.MathF.Sqrt(3);
            return new RectangleF(-width * 0.5f, -height * 0.5f, width, height);
        }

        public IEnumerable<Point> TilesInView(Camera2D cam)
        {
            yield break;
        }

        public IEnumerable<HexCoord> HexesInView(Camera2D cam)
        {
            var viewBounds = GetViewBounds(cam);
            foreach (var hex in _terrain.Keys)
            {
                var worldPos = ToWorldCenter(hex);
                if (viewBounds.Contains(worldPos))
                {
                    yield return hex;
                }
            }
        }

        public ITerrain GetTerrain(int x, int y)
        {
            return new BasicTerrain("void", 999, true);
        }

        public ITerrain GetTerrain(HexCoord hex)
        {
            return _terrain.TryGetValue(hex, out var terrain) ? terrain : new BasicTerrain("void", 999, true);
        }

        public IEnumerable<Point> Neighbors(Point t)
        {
            yield break;
        }

        public IEnumerable<HexCoord> Neighbors(HexCoord h)
        {
            return h.Neighbors().Where(hex => _terrain.ContainsKey(hex));
        }

        public Vector2 ToWorldCenter(Point t)
        {
            return Vector2.Zero;
        }

        public Vector2 ToWorldCenter(HexCoord h)
        {
            float x = HexSize * (System.MathF.Sqrt(3) * h.Q + System.MathF.Sqrt(3) / 2 * h.R);
            float y = HexSize * (3.0f / 2.0f * h.R);
            return new Vector2(x, y);
        }

        private RectangleF GetViewBounds(Camera2D cam)
        {
            var center = cam.Position;
            var halfWidth = 800f / cam.Zoom;
            var halfHeight = 600f / cam.Zoom;
            return new RectangleF(
                center.X - halfWidth,
                center.Y - halfHeight,
                halfWidth * 2,
                halfHeight * 2
            );
        }
    }
}

