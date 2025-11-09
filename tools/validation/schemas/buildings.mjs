/**
 * Building data schema validator
 * Validates web/src/data/buildings.json against Docs/DATA_SCHEMAS.md spec
 */

export function validateBuildings(data, resources) {
  const errors = [];
  const validCategories = ['infrastructure', 'farm', 'housing', 'commerce', 'storage'];

  if (!data || typeof data !== 'object') {
    return [{ type: 'fatal', message: 'Buildings data must be an object' }];
  }

  for (const [buildingId, building] of Object.entries(data)) {
    // Required fields
    if (!building.label || typeof building.label !== 'string') {
      errors.push({
        type: 'error',
        building: buildingId,
        field: 'label',
        message: 'Missing or invalid label (must be string)'
      });
    }

    if (!building.category || !validCategories.includes(building.category)) {
      errors.push({
        type: 'error',
        building: buildingId,
        field: 'category',
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    if (typeof building.buildTime !== 'number' || building.buildTime <= 0) {
      errors.push({
        type: 'error',
        building: buildingId,
        field: 'buildTime',
        message: 'buildTime must be a positive number'
      });
    }

    if (!Array.isArray(building.size) || building.size.length !== 2 ||
        building.size.some(s => typeof s !== 'number' || s < 1)) {
      errors.push({
        type: 'error',
        building: buildingId,
        field: 'size',
        message: 'size must be [width, height] array with positive integers'
      });
    }

    // Cost validation (cross-reference with resources)
    if (building.cost) {
      if (typeof building.cost !== 'object') {
        errors.push({
          type: 'error',
          building: buildingId,
          field: 'cost',
          message: 'cost must be an object'
        });
      } else {
        for (const [resourceId, amount] of Object.entries(building.cost)) {
          if (!resources[resourceId]) {
            errors.push({
              type: 'error',
              building: buildingId,
              field: 'cost',
              message: `References unknown resource: ${resourceId}`
            });
          }
          if (typeof amount !== 'number' || amount <= 0) {
            errors.push({
              type: 'error',
              building: buildingId,
              field: 'cost',
              message: `Resource ${resourceId} cost must be a positive number`
            });
          }
        }
      }
    }

    // Optional: effects object
    if (building.effects && typeof building.effects !== 'object') {
      errors.push({
        type: 'warning',
        building: buildingId,
        field: 'effects',
        message: 'effects should be an object'
      });
    }

    // Optional: production string
    if (building.production && typeof building.production !== 'string') {
      errors.push({
        type: 'warning',
        building: buildingId,
        field: 'production',
        message: 'production should be a string (recipe ID)'
      });
    }
  }

  return errors;
}
