using System.Collections.Generic;

namespace CircuitShift.Core
{
    /// <summary>
    /// Determines connectivity between the board's start and goal cells based on
    /// each tile's CURRENT rotation. Two adjacent cells are linked only when both
    /// expose a connector into each other (mutual, not one-directional).
    /// </summary>
    public static class PathValidator
    {
        public static bool TryFindPath(Board board, out List<GridPos> path)
        {
            var visited = new HashSet<GridPos> { board.Start };
            var cameFrom = new Dictionary<GridPos, GridPos>();
            var queue = new Queue<GridPos>();
            queue.Enqueue(board.Start);

            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                if (current == board.Goal)
                {
                    path = ReconstructPath(cameFrom, current);
                    return true;
                }

                foreach (var neighbor in Neighbors(board, current))
                {
                    if (visited.Contains(neighbor)) continue;
                    visited.Add(neighbor);
                    cameFrom[neighbor] = current;
                    queue.Enqueue(neighbor);
                }
            }

            path = null;
            return false;
        }

        public static bool AreLinked(Board board, GridPos a, Direction towardB)
        {
            var b = a.Offset(towardB);
            if (!board.InBounds(b)) return false;
            var tileA = board.At(a);
            var tileB = board.At(b);
            return (tileA.CurrentConnections & towardB) != 0
                && (tileB.CurrentConnections & towardB.Opposite()) != 0;
        }

        private static IEnumerable<GridPos> Neighbors(Board board, GridPos from)
        {
            foreach (var dir in DirectionExtensions.Cardinals)
            {
                if (AreLinked(board, from, dir))
                    yield return from.Offset(dir);
            }
        }

        private static List<GridPos> ReconstructPath(Dictionary<GridPos, GridPos> cameFrom, GridPos end)
        {
            var path = new List<GridPos> { end };
            var current = end;
            while (cameFrom.TryGetValue(current, out var prev))
            {
                path.Add(prev);
                current = prev;
            }
            path.Reverse();
            return path;
        }
    }
}
