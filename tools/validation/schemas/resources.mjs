/**
 * Resource data schema validator
 * Validates web/src/data/resources.json against Docs/DATA_SCHEMAS.md spec
 */

export function validateResources(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return [{ type: 'fatal', message: 'Resources data must be an object' }];
  }

  for (const [resourceId, resource] of Object.entries(data)) {
    // Required: display
    if (!resource.display || typeof resource.display !== 'string') {
      errors.push({
        type: 'error',
        resource: resourceId,
        field: 'display',
        message: 'Missing or invalid display name (must be string)'
      });
    }

    // Required: stack
    if (typeof resource.stack !== 'number' || resource.stack <= 0) {
      errors.push({
        type: 'error',
        resource: resourceId,
        field: 'stack',
        message: 'stack must be a positive number'
      });
    }

    // Validate reasonable stack limits
    if (resource.stack > 10000000) {
      errors.push({
        type: 'warning',
        resource: resourceId,
        field: 'stack',
        message: 'stack limit unusually high (>10M), verify intentional'
      });
    }
  }

  return errors;
}
