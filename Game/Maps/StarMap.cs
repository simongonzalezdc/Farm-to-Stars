using System.Collections.Generic;
using System.Linq;
using FarmToStars.Maps.Grid;
using FarmToStars.Util;
using Microsoft.Xna.Framework;
using MonoGame.Extended;

namespace FarmToStars.Maps
{
    /// <summary>
    /// Star map for Stellar phase (graph-based with nodes and hyperlanes).
    /// </summary>
    public sealed class StarMap : IMap
    {
        private readonly Dictionary<HexCoord, ITerrain> _nodes;
        private readonly Dictionary<HexCoord, List<HexCoord>> _hyperlanes;

        public RectangleF BoundsWorld { get; }

        public StarMap()
        {
            _nodes = new Dictionary<HexCoord, ITerrain>();
            _hyperlanes = new Dictionary<HexCoord, List<HexCoord>>();
            InitializeStarMap();
            BoundsWorld = new RectangleF(-2000, -2000, 4000, 4000);
        }

        private void InitializeStarMap()
        {
            // Create a simple 12-node star map
            var starPositions = new[]
            {
                new HexCoord(0, 0), new HexCoord(3, 0), new HexCoord(6, 0),
                new HexCoord(0, 3), new HexCoord(3, 3), new HexCoord(6, 3),
                new HexCoord(0, 6), new HexCoord(3, 6), new HexCoord(6, 6),
                new HexCoord(1, 1), new HexCoord(5, 1), new HexCoord(2, 4)
            };

            foreach (var pos in starPositions)
            {
                _nodes[pos] = new BasicTerrain("star", 1, false);
                _hyperlanes[pos] = new List<HexCoord>();
            }

            // Connect nearby stars
            foreach (var star in starPositions)
            {
                foreach (var other in starPositions)
                {
                    if (star.Equals(other)) continue;
                    if (star.DistanceTo(other) <= 3)
                    {
                        if (!_hyperlanes[star].Contains(other))
                        {
                            _hyperlanes[star].Add(other);
                        }
                    }
                }
            }
        }

        public IEnumerable<Point> TilesInView(Camera2D cam)
        {
            yield break;
        }

        public IEnumerable<HexCoord> HexesInView(Camera2D cam)
        {
            var viewBounds = GetViewBounds(cam);
            foreach (var hex in _nodes.Keys)
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
            return _nodes.TryGetValue(hex, out var terrain) ? terrain : new BasicTerrain("void", 999, true);
        }

        public IEnumerable<Point> Neighbors(Point t)
        {
            yield break;
        }

        public IEnumerable<HexCoord> Neighbors(HexCoord h)
        {
            return _hyperlanes.TryGetValue(h, out var neighbors) ? neighbors : Enumerable.Empty<HexCoord>();
        }

        public Vector2 ToWorldCenter(Point t)
        {
            return Vector2.Zero;
        }

        public Vector2 ToWorldCenter(HexCoord h)
        {
            float x = 200f * h.Q;
            float y = 200f * h.R;
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

