using System;

namespace CircuitShift.Core
{
    [Flags]
    public enum Direction
    {
        None = 0,
        North = 1,
        East = 2,
        South = 4,
        West = 8
    }

    public static class DirectionExtensions
    {
        public static readonly Direction[] Cardinals =
        {
            Direction.North, Direction.East, Direction.South, Direction.West
        };

        public static Direction Opposite(this Direction dir)
        {
            switch (dir)
            {
                case Direction.North: return Direction.South;
                case Direction.East: return Direction.West;
                case Direction.South: return Direction.North;
                case Direction.West: return Direction.East;
                default: throw new ArgumentOutOfRangeException(nameof(dir), dir, "Opposite requires a single cardinal direction");
            }
        }

        /// <summary>Rotates a connection bitmask clockwise by 90 degrees per step (North -> East -> South -> West).</summary>
        public static Direction RotateClockwise(this Direction mask, int steps)
        {
            steps = ((steps % 4) + 4) % 4;
            var result = Direction.None;
            foreach (var d in Cardinals)
            {
                if ((mask & d) == 0) continue;
                int index = Array.IndexOf(Cardinals, d);
                result |= Cardinals[(index + steps) % 4];
            }
            return result;
        }
    }
}
