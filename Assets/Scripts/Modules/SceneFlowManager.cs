using System;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace CircuitShift.Modules
{
    /// <summary>Named scene constants + a thin load wrapper so screen names aren't hardcoded strings scattered across UI code.</summary>
    public static class SceneFlowManager
    {
        public static class Scenes
        {
            public const string Home = "Home";
            public const string Game = "Game";
            public const string Result = "Result";
            public const string Collection = "Collection";
            public const string Settings = "Settings";
            public const string Tutorial = "Tutorial";
        }

        public static event Action<string> SceneLoadRequested;
        public static event Action<string> SceneLoaded;

        public static void Load(string sceneName)
        {
            SceneLoadRequested?.Invoke(sceneName);
            SceneManager.LoadScene(sceneName);
            SceneLoaded?.Invoke(sceneName);
        }

        /// <summary>For a loading-screen fade; SceneLoaded fires once the operation completes.</summary>
        public static AsyncOperation LoadAsync(string sceneName)
        {
            SceneLoadRequested?.Invoke(sceneName);
            var op = SceneManager.LoadSceneAsync(sceneName);
            if (op != null) op.completed += _ => SceneLoaded?.Invoke(sceneName);
            return op;
        }
    }
}
