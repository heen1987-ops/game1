using System;
using System.Collections.Generic;
using CircuitShift.Core;
using CircuitShift.Modules;
using UnityEngine;

namespace CircuitShift.UnityLayer
{
    /// <summary>
    /// Spawns a TileView per non-empty cell of a Core.Board and keeps a pulse
    /// marker positioned along the solution path. Pure presentation - tap
    /// decisions (rotate or not) are made by GameController via CellTapped.
    /// </summary>
    public class BoardView : MonoBehaviour
    {
        [SerializeField] private TileView tilePrefab;
        [SerializeField] private Transform pulseMarker;
        [SerializeField] private float cellSize = 1f;

        public event Action<GridPos> CellTapped;

        private readonly Dictionary<GridPos, TileView> tileViews = new Dictionary<GridPos, TileView>();
        private Board board;

        public void BuildFrom(Board board)
        {
            Clear();
            this.board = board;
            var tint = ThemeVisuals.GetTint(ThemeManager.ActiveThemeId);

            for (int x = 0; x < board.Width; x++)
            {
                for (int y = 0; y < board.Height; y++)
                {
                    var pos = new GridPos(x, y);
                    var data = board.At(pos);
                    if (data.Type == TileType.Empty) continue;

                    var view = Instantiate(tilePrefab, transform);
                    view.transform.localPosition = CellToLocalPosition(pos);
                    view.Bind(pos, data);
                    view.SetTint(tint);
                    view.Tapped += OnTileTapped;
                    tileViews[pos] = view;
                }
            }

            if (pulseMarker != null) pulseMarker.gameObject.SetActive(false);
        }

        /// <summary>Call after mutating a tile's TileData (e.g. a rotation) so its sprite/transform catch up.</summary>
        public void RefreshTile(GridPos pos)
        {
            if (tileViews.TryGetValue(pos, out var view)) view.Refresh();
        }

        public void UpdatePulseMarker(PulseSimulation pulse)
        {
            if (pulseMarker == null || board == null) return;

            if (!pulse.IsStarted)
            {
                pulseMarker.gameObject.SetActive(false);
                return;
            }

            pulseMarker.gameObject.SetActive(true);
            var path = board.SolutionPath;
            var from = CellToLocalPosition(path[pulse.CurrentIndex]);

            if (pulse.IsComplete || pulse.CurrentIndex >= path.Count - 1)
            {
                pulseMarker.localPosition = from;
                return;
            }

            var to = CellToLocalPosition(path[pulse.CurrentIndex + 1]);
            pulseMarker.localPosition = Vector3.Lerp(from, to, pulse.EdgeProgress01);
        }

        public Vector3 CellToLocalPosition(GridPos pos) => new Vector3(pos.X * cellSize, pos.Y * cellSize, 0f);

        public void Clear()
        {
            foreach (var view in tileViews.Values)
            {
                if (view == null) continue;
                view.Tapped -= OnTileTapped;
                Destroy(view.gameObject);
            }
            tileViews.Clear();
        }

        private void OnTileTapped(TileView view) => CellTapped?.Invoke(view.GridPosition);

        private void OnDestroy() => Clear();
    }
}
