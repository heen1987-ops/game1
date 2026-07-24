using System;

namespace CircuitShift.Core
{
    public static class GridMath
    {
        /// <summary>The cardinal direction that steps from an orthogonally-adjacent cell "from" to "to".</summary>
        public static Direction DirectionTo(GridPos from, GridPos to)
        {
            int dx = to.X - from.X, dy = to.Y - from.Y;
            if (dx == 1 && dy == 0) return Direction.East;
            if (dx == -1 && dy == 0) return Direction.West;
            if (dx == 0 && dy == 1) return Direction.North;
            if (dx == 0 && dy == -1) return Direction.South;
            throw new ArgumentException("from/to are not orthogonally adjacent");
        }
    }
}
