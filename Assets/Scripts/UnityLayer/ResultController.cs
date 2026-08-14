using System;
using CircuitShift.Modules;
using CircuitShift.Modules.Ads;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace CircuitShift.UnityLayer
{
    /// <summary>
    /// Success/fail result screen. Only place in the app that shows an
    /// interstitial (design doc section 5) and offers the double-coins /
    /// revive rewarded placements from the ad table.
    /// </summary>
    public class ResultController : MonoBehaviour
    {
        [SerializeField] private GameObject successPanel;
        [SerializeField] private GameObject failPanel;
        [SerializeField] private TMP_Text titleText;
        [SerializeField] private TMP_Text starsText;
        [SerializeField] private TMP_Text scoreText;
        [SerializeField] private TMP_Text coinsText;
        [SerializeField] private Button nextButton;
        [SerializeField] private Button retryButton;
        [SerializeField] private Button homeButton;
        [SerializeField] private Button doubleCoinsButton;
        [SerializeField] private Button reviveButton;

        private void Start()
        {
            bool success = GameSession.LastRunSuccess;
            successPanel.SetActive(success);
            failPanel.SetActive(!success);
            nextButton.gameObject.SetActive(success);

            if (success)
            {
                titleText.text = LocalizationManager.Get("result.success_title");
                starsText.text = BuildStarString(GameSession.LastStars);
                scoreText.text = GameSession.LastScore.ToString();
                coinsText.text = $"+{GameSession.LastCoinsEarned}";

                doubleCoinsButton.gameObject.SetActive(RewardedAdManager.IsReady);
                doubleCoinsButton.onClick.AddListener(OnWatchDoubleCoins);
                nextButton.onClick.AddListener(GoNext);
            }
            else
            {
                titleText.text = GameSession.LastFailReason == LevelFailReason.Timeout
                    ? LocalizationManager.Get("result.fail_timeout")
                    : LocalizationManager.Get("result.fail_disconnected");

                reviveButton.gameObject.SetActive(RewardedAdManager.IsReady);
                reviveButton.onClick.AddListener(OnWatchRevive);
            }

            retryButton.onClick.AddListener(Retry);
            homeButton.onClick.AddListener(GoHome);

            InterstitialAdManager.TryShow(AdUnitIds.InterstitialTestAndroid, Time.realtimeSinceStartup, null);
        }

        private void OnWatchDoubleCoins()
        {
            doubleCoinsButton.interactable = false;
            RewardedAdManager.Request("double_coins", AdUnitIds.RewardedTestAndroid, earned =>
            {
                if (!earned)
                {
                    doubleCoinsButton.interactable = true;
                    return;
                }

                SaveManager.Data.coins += GameSession.LastCoinsEarned;
                SaveManager.Save();
                coinsText.text = $"+{GameSession.LastCoinsEarned * 2}";
                doubleCoinsButton.gameObject.SetActive(false);
            });
        }

        private void OnWatchRevive()
        {
            // MVP simplification: "1회 부활" restarts this same seeded puzzle rather
            // than resuming mid-run; true in-place continuation needs GameController
            // to support pausing/resuming a live PulseSimulation.
            reviveButton.interactable = false;
            RewardedAdManager.Request("revive", AdUnitIds.RewardedTestAndroid, earned =>
            {
                if (earned) Retry();
                else reviveButton.interactable = true;
            });
        }

        private void GoNext()
        {
            if (GameSession.LastMode == GameMode.Infinite) GameSession.PendingInfiniteLevel++;
            GameSession.PendingSeed = null; // force a fresh puzzle

            if (GameSession.LastMode == GameMode.Weekly && WeeklyChallengeManager.NextStage(DateTime.UtcNow) == null)
            {
                SceneFlowManager.Load(SceneFlowManager.Scenes.Home); // just cleared stage 7 - nothing left to play this week
                return;
            }

            SceneFlowManager.Load(SceneFlowManager.Scenes.Game);
        }

        private void Retry()
        {
            // GameSession.PendingSeed is left untouched, so GameSceneController regenerates the same board.
            SceneFlowManager.Load(SceneFlowManager.Scenes.Game);
        }

        private void GoHome()
        {
            GameSession.PendingSeed = null;
            SceneFlowManager.Load(SceneFlowManager.Scenes.Home);
        }

        private static string BuildStarString(int stars) => new string('★', stars) + new string('☆', 3 - stars);
    }
}
