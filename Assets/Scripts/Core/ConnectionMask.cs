using System;

namespace CircuitShift.Core
{
    public static class ConnectionMask
    {
        /// <summary>Connection bitmask for a tile type at rotation 0.</summary>
        public static Direction BaseMask(TileType type)
        {
            switch (type)
            {
                case TileType.Empty: return Direction.None;
                case TileType.Straight: return Direction.North | Direction.South;
                case TileType.Curve: return Direction.North | Direction.East;
                case TileType.TJunction: return Direction.North | Direction.East | Direction.South;
                case TileType.Cross: return Direction.North | Direction.East | Direction.South | Direction.West;
                case TileType.Endpoint: return Direction.North;
                default: throw new ArgumentOutOfRangeException(nameof(type), type, null);
            }
        }

        public static Direction ConnectionsFor(TileType type, int rotationSteps) =>
            BaseMask(type).RotateClockwise(rotationSteps);

        /// <summary>
        /// Minimum number of clockwise 90-degree taps needed to turn a tile of
        /// the given type, currently at currentRotation, into ANY rotation whose
        /// connection mask equals requiredConnections. Returns -1 if the tile
        /// type can never produce that mask (wrong shape was assigned).
        /// </summary>
        public static int MinRotationsToReach(TileType type, int currentRotation, Direction requiredConnections)
        {
            var baseMask = BaseMask(type);
            int best = -1;
            for (int steps = 0; steps < 4; steps++)
            {
                if (baseMask.RotateClockwise(steps) != requiredConnections) continue;
                int taps = (((steps - currentRotation) % 4) + 4) % 4;
                if (best == -1 || taps < best) best = taps;
            }
            return best;
        }
    }
}
