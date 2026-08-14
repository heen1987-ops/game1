using CircuitShift.Core;
using CircuitShift.Modules;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace CircuitShift.UnityLayer
{
    /// <summary>
    /// First-launch onboarding (design doc section 4): a trivial fixed board with
    /// exactly one rotatable tile. Step 1 - rotate the highlighted tile until the
    /// circuit connects. Step 2 - watch the pulse travel through. Step 3 - success,
    /// continue to Home. No text tutorial, just the three guided actions.
    /// </summary>
    public class TutorialController : MonoBehaviour
    {
        private enum Step { RotateTile, WatchPulse, Done }

        [SerializeField] private BoardView boardView;
        [SerializeField] private TMP_Text instructionText;
        [SerializeField] private GameObject completePanel;
        [SerializeField] private Button continueButton;

        private Board board;
        private DifficultySettings settings;
        private PulseSimulation pulse;
        private GridPos highlightCell;
        private Step step;
        private float startTime;

        private void Start()
        {
            settings = DifficultyController.TutorialSettings();
            board = BoardGenerator.Generate(settings, DifficultyController.TutorialSeed);
            boardView.BuildFrom(board);
            boardView.CellTapped += HandleCellTapped;

            highlightCell = board.SolutionPath[1];
            step = Step.RotateTile;
            startTime = Time.time;

            instructionText.text = LocalizationManager.Get("tutorial.step1_rotate");
            if (completePanel != null) completePanel.SetActive(false);

            AnalyticsManager.TutorialStart(Application.version);
        }

        private void OnDestroy()
        {
            if (boardView != null) boardView.CellTapped -= HandleCellTapped;
        }

        private void Update()
        {
            if (step != Step.WatchPulse || pulse == null) return;

            pulse.Tick(Time.deltaTime);
            boardView.UpdatePulseMarker(pulse);

            if (pulse.IsComplete) CompleteTutorial();
        }

        private void HandleCellTapped(GridPos pos)
        {
            if (step != Step.RotateTile || pos != highlightCell) return;

            var tile = board.At(pos);
            tile.RotateClockwiseOnce();
            boardView.RefreshTile(pos);

            if (PathValidator.TryFindPath(board, out _))
            {
                step = Step.WatchPulse;
                instructionText.text = LocalizationManager.Get("tutorial.step2_watch");
                pulse = new PulseSimulation(board, settings);
            }
        }

        private void CompleteTutorial()
        {
            step = Step.Done;
            instructionText.text = LocalizationManager.Get("tutorial.step3_complete");
            if (completePanel != null) completePanel.SetActive(true);
            if (continueButton != null) continueButton.onClick.AddListener(Finish);

            AnalyticsManager.TutorialComplete(Time.time - startTime);
        }

        private void Finish()
        {
            SaveManager.Data.tutorialCompleted = true;
            SaveManager.Save();
            SceneFlowManager.Load(SceneFlowManager.Scenes.Home);
        }
    }
}
