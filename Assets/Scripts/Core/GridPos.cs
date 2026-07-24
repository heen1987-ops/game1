using System;

namespace CircuitShift.Core
{
    public readonly struct GridPos : IEquatable<GridPos>
    {
        public readonly int X;
        public readonly int Y;

        public GridPos(int x, int y)
        {
            X = x;
            Y = y;
        }

        public GridPos Offset(Direction dir)
        {
            switch (dir)
            {
                case Direction.North: return new GridPos(X, Y + 1);
                case Direction.East: return new GridPos(X + 1, Y);
                case Direction.South: return new GridPos(X, Y - 1);
                case Direction.West: return new GridPos(X - 1, Y);
                default: throw new ArgumentOutOfRangeException(nameof(dir), dir, "Offset requires a single cardinal direction");
            }
        }

        public bool Equals(GridPos other) => X == other.X && Y == other.Y;
        public override bool Equals(object obj) => obj is GridPos other && Equals(other);
        public override int GetHashCode() => (X * 397) ^ Y;
        public override string ToString() => $"({X},{Y})";

        public static bool operator ==(GridPos a, GridPos b) => a.Equals(b);
        public static bool operator !=(GridPos a, GridPos b) => !a.Equals(b);
    }
}
