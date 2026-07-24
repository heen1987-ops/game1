using System;
using System.Collections.Generic;

namespace CircuitShift.Core
{
    /// <summary>
    /// Procedural puzzle generator following design doc section 8:
    /// 1) place start/goal (the two ends of a carved path)
    /// 2) carve a valid start-to-goal path
    /// 3) infer required tile shapes along the path
    /// 4) fill remaining cells with distractor tiles
    /// 5) randomize every non-fixed tile's rotation
    /// 6) verify the structural solution is reachable
    /// 7) compute minimum-rotation difficulty and reject trivial boards
    /// Same (settings, seed) always yields the same board, so the daily puzzle
    /// can be generated independently on every device.
    /// </summary>
    public static class BoardGenerator
    {
        private const int MaxAttempts = 40;

        public static Board Generate(DifficultySettings settings, int seed)
        {
            for (int attempt = 0; attempt < MaxAttempts; attempt++)
            {
                var rng = new Random(unchecked(seed * 397 + attempt));
                var board = TryGenerate(settings, rng, seed);
                if (board != null) return board;
            }
            throw new InvalidOperationException(
                $"BoardGenerator: could not produce a solvable board for seed {seed} after {MaxAttempts} attempts");
        }

        private static Board TryGenerate(DifficultySettings settings, Random rng, int seed)
        {
            int w = settings.BoardWidth, h = settings.BoardHeight;

            var path = CarvePath(w, h, settings.MinPathLength, settings.MaxPathLength, rng);
            if (path == null || path.Count < 2) return null; // need at least a start and a goal cell

            var pathSet = new HashSet<GridPos>(path);
            var tiles = new TileData[w, h];

            for (int x = 0; x < w; x++)
                for (int y = 0; y < h; y++)
                    tiles[x, y] = new TileData { Type = TileType.Empty, RotationSteps = 0 };

            // Steps 1-3: required connections + shape per path cell
            for (int i = 0; i < path.Count; i++)
            {
                var cell = path[i];
                var connections = Direction.None;
                if (i > 0) connections |= GridMath.DirectionTo(cell, path[i - 1]);
                if (i < path.Count - 1) connections |= GridMath.DirectionTo(cell, path[i + 1]);

                var type = InferType(connections);
                var tile = new TileData
                {
                    Type = type,
                    RequiredConnections = connections,
                    IsStart = i == 0,
                    IsGoal = i == path.Count - 1
                };

                int requiredRotation = ConnectionMask.MinRotationsToReach(type, 0, connections);
                if (requiredRotation < 0) return null; // shouldn't happen; defensive against InferType bugs

                // Endpoints stay pre-oriented (not player-rotatable). Mid-path tiles hold this
                // solved value only until the scramble pass below.
                tile.RotationSteps = requiredRotation;
                tiles[cell.X, cell.Y] = tile;
            }

            // Step 4: distractor tiles on the remaining cells
            var distractorTypes = new[] { TileType.Straight, TileType.Curve, TileType.TJunction, TileType.Cross };
            for (int x = 0; x < w; x++)
            {
                for (int y = 0; y < h; y++)
                {
                    var cell = new GridPos(x, y);
                    if (pathSet.Contains(cell)) continue;
                    if (rng.NextDouble() >= settings.DistractorDensity) continue;

                    tiles[x, y] = new TileData
                    {
                        Type = distractorTypes[rng.Next(distractorTypes.Length)],
                        RotationSteps = rng.Next(4)
                    };
                }
            }

            var board = new Board
            {
                Width = w,
                Height = h,
                Tiles = tiles,
                Start = path[0],
                Goal = path[path.Count - 1],
                SolutionPath = path,
                PathLength = path.Count,
                Seed = seed
            };

            // Step 6: structural sanity check with every path tile at its solved rotation
            if (!PathValidator.TryFindPath(board, out _)) return null;

            // Step 5 (scramble): randomize every path tile except the fixed start/goal endpoints
            for (int i = 1; i < path.Count - 1; i++)
            {
                var cell = path[i];
                tiles[cell.X, cell.Y].RotationSteps = rng.Next(4);
            }

            // Step 7: difficulty scoring + trivial-board rejection
            int minRotations = 0;
            for (int i = 1; i < path.Count - 1; i++)
            {
                var cell = path[i];
                var tile = tiles[cell.X, cell.Y];
                minRotations += ConnectionMask.MinRotationsToReach(tile.Type, tile.RotationSteps, tile.RequiredConnections.Value);
            }
            if (minRotations == 0) return null; // already solved, no challenge - retry with a new seed offset

            board.MinRotations = minRotations;
            return board;
        }

        /// <summary>Randomized self-avoiding walk. Returns null (caller retries) if it can't reach the target length.</summary>
        private static List<GridPos> CarvePath(int w, int h, int minLen, int maxLen, Random rng)
        {
            maxLen = Math.Min(maxLen, w * h);
            if (minLen > maxLen) minLen = maxLen;
            int targetLen = rng.Next(minLen, maxLen + 1);

            var start = new GridPos(rng.Next(w), rng.Next(h));
            var path = new List<GridPos> { start };
            var visited = new HashSet<GridPos> { start };

            while (path.Count < targetLen)
            {
                var current = path[path.Count - 1];
                var dirs = ShuffledCardinals(rng);

                GridPos? next = null;
                foreach (var dir in dirs)
                {
                    var candidate = current.Offset(dir);
                    if (candidate.X < 0 || candidate.X >= w || candidate.Y < 0 || candidate.Y >= h) continue;
                    if (visited.Contains(candidate)) continue;
                    next = candidate;
                    break;
                }

                if (next == null) break; // walk is stuck
                path.Add(next.Value);
                visited.Add(next.Value);
            }

            return path.Count >= minLen ? path : null;
        }

        private static Direction[] ShuffledCardinals(Random rng)
        {
            var dirs = (Direction[])DirectionExtensions.Cardinals.Clone();
            for (int i = dirs.Length - 1; i > 0; i--)
            {
                int j = rng.Next(i + 1);
                (dirs[i], dirs[j]) = (dirs[j], dirs[i]);
            }
            return dirs;
        }

        private static TileType InferType(Direction connections)
        {
            int count = PopCount(connections);
            switch (count)
            {
                case 1: return TileType.Endpoint;
                case 2:
                    bool isStraight = connections == (Direction.North | Direction.South)
                                    || connections == (Direction.East | Direction.West);
                    return isStraight ? TileType.Straight : TileType.Curve;
                case 3: return TileType.TJunction;
                case 4: return TileType.Cross;
                default: throw new ArgumentException($"Path cell has {count} connections; expected 1-4");
            }
        }

        private static int PopCount(Direction mask)
        {
            int count = 0;
            int value = (int)mask;
            while (value != 0)
            {
                count += value & 1;
                value >>= 1;
            }
            return count;
        }
    }
}
