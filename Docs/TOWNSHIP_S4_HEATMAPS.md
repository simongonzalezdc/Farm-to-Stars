# Township S4: Heatmaps & Outages Implementation

## Overview

S4 (Advanced Simulation Systems) completion includes:
1. ✅ Zone Maturation (automatic building spawning)
2. ✅ Utilities Propagation (service coverage calculation)
3. ✅ Dynamic Demand Calculation
4. ✅ Outage Workflow (service disruptions & repairs)
5. ✅ Heatmap Visualization System
6. 🚧 Heatmap Rendering (basic structure in place, visual rendering TBD)

## Implemented Systems

### Heatmap Visualization (`heatmapVisualization.ts`)
- **Power/Water/Safety/Education**: Shows utility coverage from service buildings
- **Happiness**: Calculated based on service coverage at each tile
- **RCI Demand**: Visualizes residential/commercial/industrial demand
- Color schemes: Blue (power/water), Orange (safety), Purple (education), Green-Red gradient (happiness), RGB for demand

### Outage Workflow (`outageWorkflow.ts`)
- **Random Outages**: Service buildings can fail based on health and maintenance
- **Health Degradation**: Buildings lose health over time without maintenance
- **Repair System**: Players can repair buildings for a cost (20% of build cost)
- **Configurable**: Mean time between outages, repair costs, degradation rate

### Integration
- **TownshipManager**: Calls outage system every tick, generates heatmap data on demand
- **TownshipController**: Exposes `generateHeatmap()`, `repairBuilding()`, `getBuildingsInOutage()`
- **HeatmapUI**: Toggle buttons for each heatmap type with visual feedback

## Usage

```typescript
// Generate a heatmap
const heatmapData = controller.generateHeatmap('power');
// Returns: { width, height, values: number[][], type: 'power' }

// Repair a building
const result = controller.repairBuilding(buildingId);
if (result.success) {
  console.log('Repaired! Cost:', result.cost);
}

// Get buildings in outage
const outages = controller.getBuildingsInOutage();
```

## Next Steps (Future Enhancement)

### Heatmap Rendering in Phaser
The heatmap visualization system generates data, but the Phaser rendering layer needs:
1. Create colored overlays in `TownshipScene.renderHeatmap()`
2. Use Phaser Graphics or Shader for gradient rendering
3. Toggle visibility with keyboard shortcuts (H key)
4. Add legend UI showing what colors mean

Example implementation:
```typescript
private renderHeatmap(heatmapData: HeatmapData): void {
  this.heatmapLayer.removeAll(true);

  for (let y = 0; y < heatmapData.height; y++) {
    for (let x = 0; x < heatmapData.width; x++) {
      const value = heatmapData.values[y][x];
      const color = this.heatmapSystem.getColorForValue(value, heatmapData.type);
      const alpha = this.heatmapSystem.getAlphaForValue(value);

      const { x: sx, y: sy } = gridToScreen(x, y, 0);
      const tile = this.add.rectangle(sx, sy, TILE_W, TILE_H, color, alpha);
      this.heatmapLayer.add(tile);
    }
  }
}
```

## Testing

Unit tests cover:
- Heatmap data generation for all types
- Color interpolation
- Outage probability calculation
- Repair cost calculation
- Health degradation over time

Run tests:
```bash
npm test -- heatmapVisualization
npm test -- outageWorkflow
```

## Performance Notes

- Heatmap generation is O(n) where n = grid size
- Utilities propagation uses radius-based coverage (efficient for small radii)
- Outage checks use exponential distribution for realistic random intervals
- Consider caching heatmap data if rendering every frame is slow

## Balance Values

- **Zone Maturation Rate**: 2% per second with positive demand
- **Outage MTBF**: 600 seconds (10 minutes average)
- **Repair Cost**: 20% of building cost × damage percentage
- **Health Degradation**: 0.5% per second without maintenance
- **Repair Time Base**: 60 seconds × damage percentage
