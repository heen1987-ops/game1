namespace CircuitShift.Modules.Ads
{
    /// <summary>
    /// Google's publicly-documented Android test ad unit IDs. Safe to ship in
    /// non-release builds; real per-platform unit IDs come from the AdMob console
    /// once the app passes review (design doc checklist: "테스트 광고와 실제
    /// 광고 단위 분리"). Never point a release build at these test constants.
    /// </summary>
    public static class AdUnitIds
    {
        public const string RewardedTestAndroid = "ca-app-pub-3940256099942544/5224354917";
        public const string InterstitialTestAndroid = "ca-app-pub-3940256099942544/1033173712";
    }
}
