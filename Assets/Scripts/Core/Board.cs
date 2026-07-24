using System.Collections.Generic;

namespace CircuitShift.Core
{
    public class Board
    {
        public int Width;
        public int Height;
        public TileData[,] Tiles;
        public GridPos Start;
        public GridPos Goal;

        /// <summary>Ordered cells from Start to Goal that the pulse travels along, as carved by BoardGenerator.</summary>
        public List<GridPos> SolutionPath;

        /// <summary>Sum of minimum taps needed on every path tile, computed at generation time. Used for star scoring.</summary>
        public int MinRotations;

        public int PathLength;
        public int Seed;

        public TileData At(GridPos p) => Tiles[p.X, p.Y];

        public bool InBounds(GridPos p) => p.X >= 0 && p.X < Width && p.Y >= 0 && p.Y < Height;

        public Board Clone()
        {
            var clone = new Board
            {
                Width = Width,
                Height = Height,
                Start = Start,
                Goal = Goal,
                MinRotations = MinRotations,
                PathLength = PathLength,
                Seed = Seed,
                SolutionPath = SolutionPath != null ? new List<GridPos>(SolutionPath) : null,
                Tiles = new TileData[Width, Height]
            };
            for (int x = 0; x < Width; x++)
                for (int y = 0; y < Height; y++)
                    clone.Tiles[x, y] = Tiles[x, y].Clone();
            return clone;
        }
    }
}
