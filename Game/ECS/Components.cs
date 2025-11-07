using System;
using System.Collections.Generic;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;

namespace FarmToStars.ECS
{
    /// <summary>
    /// Transform component for position and rotation.
    /// </summary>
    public struct Transform
    {
        public Vector2 Pos;
        public float Rot;
    }

    /// <summary>
    /// Tile position component for square grids.
    /// </summary>
    public struct TilePos
    {
        public int X;
        public int Y;
    }

    /// <summary>
    /// Hex position component for hex grids.
    /// </summary>
    public struct HexPos
    {
        public int Q;
        public int R;
    }

    /// <summary>
    /// Sprite component for rendering.
    /// </summary>
    public struct Sprite
    {
        public Texture2D Tex;
        public Rectangle Src;
        public Vector2 Origin;
    }

    /// <summary>
    /// Resource stack for storage.
    /// </summary>
    public readonly record struct ResourceStack(string ResourceId, int Amount, int Max);

    /// <summary>
    /// Storage component for resources.
    /// </summary>
    public struct Storage
    {
        public ResourceStack[] Items;
    }

    /// <summary>
    /// Production rate (input or output).
    /// </summary>
    public readonly record struct ProductionRate(string ResourceId, float AmountPerSecond);

    /// <summary>
    /// Production component for buildings that produce resources.
    /// </summary>
    public struct Production
    {
        public ProductionRate[] Inputs;
        public ProductionRate[] Outputs;
        public float Progress;
    }

    /// <summary>
    /// Construction component for buildings being built.
    /// </summary>
    public struct Construction
    {
        public TimeSpan Remaining;
        public string BuildingId;
    }

    /// <summary>
    /// Population component for cities.
    /// </summary>
    public struct Population
    {
        public int Citizens;
        public int Employed;
    }

    /// <summary>
    /// Order kind for unit orders.
    /// </summary>
    public enum OrderKind
    {
        MoveToTile,
        BuildAtTile,
        Harvest,
        Attack,
        Patrol,
        Wait
    }

    /// <summary>
    /// Order for units.
    /// </summary>
    public readonly record struct Order(OrderKind Kind, int X, int Y);

    /// <summary>
    /// Orders component for units.
    /// </summary>
    public struct Orders
    {
        public Queue<Order> Queue;
    }

    /// <summary>
    /// Owner component for faction ownership.
    /// </summary>
    public struct Owner
    {
        public int FactionId;
    }
}

