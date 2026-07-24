using CircuitShift.Modules;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace CircuitShift.UnityLayer
{
    /// <summary>Wires the three MVP mode buttons (design doc section 3) plus settings entry.</summary>
    public class HomeController : MonoBehaviour
    {
        [SerializeField] private Button dailyButton;
        [SerializeField] private Button quickButton;
        [SerializeField] private Button infiniteButton;
        [SerializeField] private Button settingsButton;

        [SerializeField] private TMP_Text titleText;
        [SerializeField] private TMP_Text dailyLabel;
        [SerializeField] private TMP_Text quickLabel;
        [SerializeField] private TMP_Text infiniteLabel;
        [SerializeField] private TMP_Text streakText;

        private void Start()
        {
            titleText.text = LocalizationManager.Get("home.title");
            dailyLabel.text = LocalizationManager.Get("home.play_daily");
            quickLabel.text = LocalizationManager.Get("home.play_quick");
            infiniteLabel.text = LocalizationManager.Get("home.play_infinite");
            streakText.text = SaveManager.Data.dailyStreak.ToString();

            dailyButton.onClick.AddListener(PlayDaily);
            quickButton.onClick.AddListener(PlayQuick);
            infiniteButton.onClick.AddListener(PlayInfinite);
            settingsButton.onClick.AddListener(OpenSettings);
        }

        private void PlayDaily()
        {
            GameSession.PendingMode = GameMode.Daily;
            SceneFlowManager.Load(SceneFlowManager.Scenes.Game);
        }

        private void PlayQuick()
        {
            GameSession.PendingMode = GameMode.Quick;
            SceneFlowManager.Load(SceneFlowManager.Scenes.Game);
        }

        private void PlayInfinite()
        {
            GameSession.PendingMode = GameMode.Infinite;
            GameSession.PendingInfiniteLevel = Mathf.Max(1, SaveManager.Data.bestInfiniteLevel);
            SceneFlowManager.Load(SceneFlowManager.Scenes.Game);
        }

        private void OpenSettings() => SceneFlowManager.Load(SceneFlowManager.Scenes.Settings);
    }
}
