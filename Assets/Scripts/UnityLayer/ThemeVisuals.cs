using System.Collections.Generic;
using UnityEngine;

namespace CircuitShift.UnityLayer
{
    /// <summary>
    /// Maps a theme id to a sprite tint. Placeholder visual differentiation until
    /// real per-theme art exists - keys here must match Core.Meta.ThemeCatalog ids.
    /// </summary>
    public static class ThemeVisuals
    {
        private static readonly Dictionary<string, Color> TintByThemeId = new Dictionary<string, Color>
        {
            ["default"] = Color.white,
            ["neon"] = new Color(0.4f, 1f, 0.9f),
            ["sunset"] = new Color(1f, 0.55f, 0.3f),
            ["mono"] = new Color(0.75f, 0.75f, 0.75f),
        };

        public static Color GetTint(string themeId) =>
            TintByThemeId.TryGetValue(themeId, out var color) ? color : Color.white;
    }
}
