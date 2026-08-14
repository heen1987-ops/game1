using System.Collections.Generic;
using System.Linq;

namespace CircuitShift.Core.Meta
{
    /// <summary>
    /// Hardcoded local theme catalog (design doc: "별과 코인으로 보드 테마·펄스 효과·배경을
    /// 해제한다"). No backend/CMS for the MVP, so unlocks and pricing live here.
    /// </summary>
    public static class ThemeCatalog
    {
        public const string DefaultThemeId = "default";

        public static readonly IReadOnlyList<ThemeDefinition> All = new List<ThemeDefinition>
        {
            new ThemeDefinition { Id = DefaultThemeId, NameKey = "theme.default", CoinCost = 0 },
            new ThemeDefinition { Id = "neon", NameKey = "theme.neon", CoinCost = 300 },
            new ThemeDefinition { Id = "sunset", NameKey = "theme.sunset", CoinCost = 500 },
            new ThemeDefinition { Id = "mono", NameKey = "theme.mono", CoinCost = 800 },
        };

        public static ThemeDefinition Get(string id) => All.FirstOrDefault(t => t.Id == id);
    }
}
