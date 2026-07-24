using System;

namespace CircuitShift.Core
{
    /// <summary>
    /// Turns a completed run's rotation count and remaining time into the
    /// 1-3 star rating and score shown on the result screen (design doc section 3:
    /// "사용한 회전 수, 완료 시간, 경유 노드 수에 따라 별 1~3개를 부여한다").
    /// Only call this for a run where PulseSimulation.IsComplete is true.
    /// </summary>
    public static class ScoreCalculator
    {
        public static int Stars(int rotationsUsed, int minRotations, float timeRemainingSeconds, float timeLimitSeconds)
        {
            float timeRatio = timeLimitSeconds > 0f ? Clamp01(timeRemainingSeconds / timeLimitSeconds) : 0f;
            int extraTaps = Math.Max(0, rotationsUsed - Math.Max(0, minRotations));

            if (extraTaps == 0 && timeRatio >= 0.4f) return 3;
            if (extraTaps <= Math.Max(1, minRotations / 2) || timeRatio >= 0.15f) return 2;
            return 1;
        }

        public static int Score(int rotationsUsed, int minRotations, float timeRemainingSeconds, float timeLimitSeconds)
        {
            const int completionBonus = 500;
            int extraTaps = Math.Max(0, rotationsUsed - Math.Max(0, minRotations));
            int efficiencyBonus = Math.Max(0, 300 - extraTaps * 20);

            float timeRatio = timeLimitSeconds > 0f ? Clamp01(timeRemainingSeconds / timeLimitSeconds) : 0f;
            int timeBonus = (int)Math.Round(timeRatio * 200f);

            return completionBonus + efficiencyBonus + timeBonus;
        }

        private static float Clamp01(float value) => value < 0f ? 0f : value > 1f ? 1f : value;
    }
}
