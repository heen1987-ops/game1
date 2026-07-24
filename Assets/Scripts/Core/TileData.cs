namespace CircuitShift.Core
{
    public class TileData
    {
        public TileType Type;

        /// <summary>Current orientation in 90-degree clockwise steps (0-3). Mutated by player taps.</summary>
        public int RotationSteps;

        public bool IsStart;
        public bool IsGoal;

        /// <summary>
        /// Set only for tiles that sit on the generated solution path; the connection
        /// mask this tile must expose for the pulse to pass through it. Null for
        /// distractor tiles that are not part of the intended solution.
        /// </summary>
        public Direction? RequiredConnections;

        public Direction CurrentConnections => ConnectionMask.ConnectionsFor(Type, RotationSteps);

        public void RotateClockwiseOnce() => RotationSteps = (RotationSteps + 1) % 4;

        public TileData Clone() => new TileData
        {
            Type = Type,
            RotationSteps = RotationSteps,
            IsStart = IsStart,
            IsGoal = IsGoal,
            RequiredConnections = RequiredConnections
        };
    }
}
