namespace CircuitShift.Core
{
    /// <summary>
    /// Endpoint is used for the start/goal cell itself; its single required
    /// connector is computed by the generator from the path's first/last step.
    /// </summary>
    public enum TileType
    {
        Empty,
        Straight,
        Curve,
        TJunction,
        Cross,
        Endpoint
    }
}
