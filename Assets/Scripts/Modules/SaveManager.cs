using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace CircuitShift.Modules
{
    /// <summary>Everything persisted between sessions. No login, no server - single local JSON file (design doc section 7).</summary>
    [Serializable]
    public class SaveData
    {
        public int coins;
        public List<string> unlockedThemeIds = new List<string>();

        /// <summary>Empty means "use ThemeCatalog.DefaultThemeId".</summary>
        public string activeThemeId = "";

        public int dailyStreak;

        /// <summary>yyyyMMdd of the last daily puzzle the player completed, empty if never.</summary>
        public string lastDailyPuzzleDate = "";

        public int bestInfiniteLevel;
        public int totalLevelsCompleted;
        public bool tutorialCompleted;

        /// <summary>ISO week (see DifficultyController.WeeklyWeekId) that weeklyChallengeStage counts progress for.</summary>
        public string weeklyChallengeWeekId = "";

        /// <summary>Stages completed (0-7) within weeklyChallengeWeekId.</summary>
        public int weeklyChallengeStage;
    }

    /// <summary>
    /// Single-file local save/load. Game-agnostic beyond the SaveData shape, so a
    /// second title can reuse this class by swapping SaveData's fields.
    /// </summary>
    public static class SaveManager
    {
        private const string FileName = "save.json";
        private static SaveData cached;

        public static SaveData Data => cached ?? (cached = Load());

        private static string FilePath => Path.Combine(Application.persistentDataPath, FileName);

        public static void Save()
        {
            try
            {
                File.WriteAllText(FilePath, JsonUtility.ToJson(Data, true));
            }
            catch (Exception e)
            {
                Debug.LogError($"SaveManager: failed to write save file. {e.Message}");
            }
        }

        private static SaveData Load()
        {
            try
            {
                if (File.Exists(FilePath))
                {
                    var loaded = JsonUtility.FromJson<SaveData>(File.ReadAllText(FilePath));
                    if (loaded != null) return loaded;
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"SaveManager: failed to read save file, starting fresh. {e.Message}");
            }
            return new SaveData();
        }
    }
}
