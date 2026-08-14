namespace CircuitShift.UnityLayer
{
    public enum GameMode
    {
        Daily,
        Quick,
        Infinite,
        Weekly
    }

    /// <summary>
    /// Plain static payload for passing the selected mode into the Game scene and
    /// the run's outcome into the Result scene. Scene loads destroy non-persistent
    /// GameObjects, so this (not a MonoBehaviour) is the simplest way to carry a
    /// few values across LoadScene calls without a DontDestroyOnLoad object.
    /// </summary>
    public static class GameSession
    {
        public static GameMode PendingMode;
        public static int PendingInfiniteLevel = 1;

        /// <summary>
        /// Set by GameSceneController after generating a board so "retry" reproduces
        /// the same puzzle instead of a fresh random one. Cleared before "next"/a new
        /// mode selection. Daily and Weekly ignore this - they're already date/week-seeded.
        /// </summary>
        public static int? PendingSeed;

        public static GameMode LastMode;
        public static bool LastRunSuccess;
        public static int LastStars;
        public static int LastScore;
        public static int LastRotationsUsed;
        public static int LastCoinsEarned;
        public static float LastDuration;
        public static LevelFailReason LastFailReason;
    }
}
