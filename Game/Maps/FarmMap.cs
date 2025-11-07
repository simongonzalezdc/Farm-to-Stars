using System.Collections.Generic;
using System.Linq;
using FarmToStars.Maps.Grid;
using FarmToStars.Util;
using Microsoft.Xna.Framework;
using MonoGame.Extended;

namespace FarmToStars.Maps
{
    /// <summary>
    /// Square grid map for Homestead phase (200x200 tiles).
    /// </summary>
    public sealed class FarmMap : IMap
    {
        private const int TileSize = 32;
        private const int Width = 200;
        private const int Height = 200;
        private readonly ITerrain[,] _terrain;

        public RectangleF BoundsWorld => new RectangleF(0, 0, Width * TileSize, Height * TileSize);

        public FarmMap()
        {
            _terrain = new ITerrain[Width, Height];
            InitializeTerrain();
        }

        private void InitializeTerrain()
        {
            // Initialize all tiles as grass
            for (int x = 0; x < Width; x++)
            {
                for (int y = 0; y < Height; y++)
                {
                    _terrain[x, y] = new BasicTerrain("grass", 1, false);
                }
            }
        }

        public IEnumerable<Point> TilesInView(Camera2D cam)
        {
            var viewBounds = GetViewBounds(cam);
            int minX = (int)System.Math.Max(0, viewBounds.Left / TileSize);
            int maxX = (int)System.Math.Min(Width - 1, viewBounds.Right / TileSize);
            int minY = (int)System.Math.Max(0, viewBounds.Top / TileSize);
            int maxY = (int)System.Math.Min(Height - 1, viewBounds.Bottom / TileSize);

            for (int x = minX; x <= maxX; x++)
            {
                for (int y = minY; y <= maxY; y++)
                {
                    yield return new Point(x, y);
                }
            }
        }

        public IEnumerable<HexCoord> HexesInView(Camera2D cam)
        {
            // Not applicable for square maps
            yield break;
        }

        public ITerrain GetTerrain(int x, int y)
        {
            if (x < 0 || x >= Width || y < 0 || y >= Height)
                return new BasicTerrain("void", 999, true);
            return _terrain[x, y];
        }

        public ITerrain GetTerrain(HexCoord hex)
        {
            // Not applicable for square maps
            return new BasicTerrain("void", 999, true);
        }

        public IEnumerable<Point> Neighbors(Point t)
        {
            return SquareCoord.Neighbors4(t)
                .Where(p => p.X >= 0 && p.X < Width && p.Y >= 0 && p.Y < Height);
        }

        public IEnumerable<HexCoord> Neighbors(HexCoord h)
        {
            // Not applicable for square maps
            yield break;
        }

        public Vector2 ToWorldCenter(Point t)
        {
            return new Vector2(t.X * TileSize + TileSize * 0.5f, t.Y * TileSize + TileSize * 0.5f);
        }

        public Vector2 ToWorldCenter(HexCoord h)
        {
            // Not applicable for square maps
            return Vector2.Zero;
        }

        private RectangleF GetViewBounds(Camera2D cam)
        {
            // Approximate view bounds (would need viewport size in real implementation)
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

