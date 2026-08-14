using CircuitShift.Core.Meta;

namespace CircuitShift.Modules
{
    /// <summary>Unlock/select operations over ThemeCatalog, backed by SaveManager. UI (CollectionController) drives this; it holds no UI state itself.</summary>
    public static class ThemeManager
    {
        public static System.Collections.Generic.IReadOnlyList<ThemeDefinition> AllThemes => ThemeCatalog.All;

        public static string ActiveThemeId =>
            string.IsNullOrEmpty(SaveManager.Data.activeThemeId) ? ThemeCatalog.DefaultThemeId : SaveManager.Data.activeThemeId;

        public static bool IsUnlocked(string themeId)
        {
            var theme = ThemeCatalog.Get(themeId);
            return theme != null && (theme.CoinCost == 0 || SaveManager.Data.unlockedThemeIds.Contains(themeId));
        }

        /// <returns>true if the theme is unlocked when this returns (already unlocked, or just purchased).</returns>
        public static bool TryUnlock(string themeId)
        {
            if (IsUnlocked(themeId)) return true;

            var theme = ThemeCatalog.Get(themeId);
            if (theme == null || SaveManager.Data.coins < theme.CoinCost) return false;

            SaveManager.Data.coins -= theme.CoinCost;
            SaveManager.Data.unlockedThemeIds.Add(themeId);
            SaveManager.Save();
            AnalyticsManager.ThemeUnlock(themeId, theme.CoinCost);
            return true;
        }

        public static void SetActive(string themeId)
        {
            if (!IsUnlocked(themeId)) return;
            SaveManager.Data.activeThemeId = themeId;
            SaveManager.Save();
        }
    }
}
