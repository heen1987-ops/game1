namespace CircuitShift.Core.Meta
{
    public class ThemeDefinition
    {
        public string Id;

        /// <summary>Localization key for the display name, e.g. "theme.neon".</summary>
        public string NameKey;

        /// <summary>Coins required to unlock. 0 means unlocked from the start.</summary>
        public int CoinCost;
    }
}
