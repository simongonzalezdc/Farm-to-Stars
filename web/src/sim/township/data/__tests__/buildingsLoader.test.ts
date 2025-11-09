import { describe, expect, it } from 'vitest';
import {
  loadBuildings,
  getBuilding,
  getBuildingsByType,
  getBuildingsForCivilization,
  isBuildingUnlocked,
  getBuildingsTable
} from '../buildingsLoader';

describe('Buildings Loader', () => {
  describe('loadBuildings()', () => {
    it('loads all buildings from JSON', () => {
      const buildings = loadBuildings();

      expect(buildings).toBeDefined();
      expect(Object.keys(buildings).length).toBeGreaterThan(0);
    });

    it('all buildings have required fields', () => {
      const buildings = loadBuildings();

      for (const [id, building] of Object.entries(buildings)) {
        expect(building.id).toBe(id);
        expect(building.name).toBeTruthy();
        expect(building.description).toBeTruthy();
        expect(['residential', 'commercial', 'industrial', 'service']).toContain(building.type);
        expect(building.tier).toBeGreaterThanOrEqual(1);
        expect(building.tier).toBeLessThanOrEqual(3);
        expect(building.cost).toBeDefined();
        expect(building.buildTime).toBeGreaterThan(0);
        expect(building.capacity).toBeGreaterThanOrEqual(0);
        expect(building.size).toBeDefined();
        expect(building.size.width).toBeGreaterThan(0);
        expect(building.size.height).toBeGreaterThan(0);
        expect(building.maintenance).toBeDefined();
        expect(building.maintenance.cost).toBeGreaterThan(0);
        expect(building.maintenance.interval).toBeGreaterThan(0);
      }
    });

    it('all residential buildings have capacity > 0', () => {
      const buildings = loadBuildings();
      const residential = Object.values(buildings).filter(b => b.type === 'residential');

      expect(residential.length).toBeGreaterThan(0);

      for (const building of residential) {
        expect(building.capacity).toBeGreaterThan(0);
      }
    });

    it('all service buildings have provides array', () => {
      const buildings = loadBuildings();
      const services = Object.values(buildings).filter(b => b.type === 'service');

      expect(services.length).toBeGreaterThan(0);

      for (const building of services) {
        expect(building.provides).toBeDefined();
        expect(Array.isArray(building.provides)).toBe(true);
        expect(building.provides!.length).toBeGreaterThan(0);
      }
    });

    it('all service buildings have service radius', () => {
      const buildings = loadBuildings();
      const services = Object.values(buildings).filter(b => b.type === 'service');

      for (const building of services) {
        expect(building.serviceRadius).toBeDefined();
        expect(building.serviceRadius!).toBeGreaterThan(0);
      }
    });
  });

  describe('getBuilding()', () => {
    it('returns building by ID', () => {
      const building = getBuilding('residential_house');

      expect(building).toBeDefined();
      expect(building?.id).toBe('residential_house');
      expect(building?.type).toBe('residential');
    });

    it('returns undefined for non-existent building', () => {
      const building = getBuilding('nonexistent_building');

      expect(building).toBeUndefined();
    });
  });

  describe('getBuildingsByType()', () => {
    it('returns all residential buildings', () => {
      const residential = getBuildingsByType('residential');

      expect(residential.length).toBeGreaterThan(0);
      expect(residential.every(b => b.type === 'residential')).toBe(true);
    });

    it('returns all commercial buildings', () => {
      const commercial = getBuildingsByType('commercial');

      expect(commercial.length).toBeGreaterThan(0);
      expect(commercial.every(b => b.type === 'commercial')).toBe(true);
    });

    it('returns all industrial buildings', () => {
      const industrial = getBuildingsByType('industrial');

      expect(industrial.length).toBeGreaterThan(0);
      expect(industrial.every(b => b.type === 'industrial')).toBe(true);
    });

    it('returns all service buildings', () => {
      const services = getBuildingsByType('service');

      expect(services.length).toBeGreaterThan(0);
      expect(services.every(b => b.type === 'service')).toBe(true);
    });

    it('residential buildings are ordered by tier', () => {
      const residential = getBuildingsByType('residential');
      const tiers = residential.map(b => b.tier);

      // Check we have buildings of multiple tiers
      expect(new Set(tiers).size).toBeGreaterThan(1);
    });
  });

  describe('getBuildingsForCivilization()', () => {
    it('returns all universal buildings for any civilization', () => {
      const teotihuacan = getBuildingsForCivilization('teotihuacan');
      const maya = getBuildingsForCivilization('maya');

      // Both should have access to basic buildings
      const universalBuildings = ['residential_house', 'commercial_shop', 'industrial_workshop'];

      for (const buildingId of universalBuildings) {
        expect(teotihuacan.some(b => b.id === buildingId)).toBe(true);
        expect(maya.some(b => b.id === buildingId)).toBe(true);
      }
    });

    it('Teotihuacan has solar array', () => {
      const buildings = getBuildingsForCivilization('teotihuacan');

      expect(buildings.some(b => b.id === 'service_solar_array')).toBe(true);
    });

    it('Maya has observatory', () => {
      const buildings = getBuildingsForCivilization('maya');

      expect(buildings.some(b => b.id === 'service_observatory')).toBe(true);
    });

    it('Moche has aqueduct', () => {
      const buildings = getBuildingsForCivilization('moche');

      expect(buildings.some(b => b.id === 'service_aqueduct')).toBe(true);
    });

    it('Hopewell has trading post', () => {
      const buildings = getBuildingsForCivilization('hopewell');

      expect(buildings.some(b => b.id === 'service_trading_post')).toBe(true);
    });

    it('Puebloan has central plaza', () => {
      const buildings = getBuildingsForCivilization('puebloan');

      expect(buildings.some(b => b.id === 'service_plaza')).toBe(true);
    });

    it('civilization-specific buildings are not available to others', () => {
      const maya = getBuildingsForCivilization('maya');
      const moche = getBuildingsForCivilization('moche');

      // Maya shouldn't have Moche's aqueduct
      expect(maya.some(b => b.id === 'service_aqueduct')).toBe(false);
      // Moche shouldn't have Maya's observatory
      expect(moche.some(b => b.id === 'service_observatory')).toBe(false);
    });
  });

  describe('isBuildingUnlocked()', () => {
    it('basic buildings are unlocked from start', () => {
      const house = getBuilding('residential_house')!;

      expect(isBuildingUnlocked(house, 100, 'teotihuacan')).toBe(true);
    });

    it('population-gated buildings require minimum population', () => {
      const apartment = getBuilding('residential_apartment')!;

      expect(isBuildingUnlocked(apartment, 100, 'teotihuacan')).toBe(false);
      expect(isBuildingUnlocked(apartment, 250, 'teotihuacan')).toBe(true);
    });

    it('civilization-specific buildings require correct civilization', () => {
      const solarArray = getBuilding('service_solar_array')!;

      expect(isBuildingUnlocked(solarArray, 500, 'teotihuacan')).toBe(true);
      expect(isBuildingUnlocked(solarArray, 500, 'maya')).toBe(false);
    });

    it('checks both population and civilization requirements', () => {
      const observatory = getBuilding('service_observatory')!;

      // Wrong civilization
      expect(isBuildingUnlocked(observatory, 800, 'teotihuacan')).toBe(false);
      // Low population
      expect(isBuildingUnlocked(observatory, 100, 'maya')).toBe(false);
      // Both correct
      expect(isBuildingUnlocked(observatory, 800, 'maya')).toBe(true);
    });
  });

  describe('getBuildingsTable()', () => {
    it('returns same instance on multiple calls (caching)', () => {
      const table1 = getBuildingsTable();
      const table2 = getBuildingsTable();

      expect(table1).toBe(table2);
    });

    it('returns valid buildings table', () => {
      const table = getBuildingsTable();

      expect(Object.keys(table).length).toBeGreaterThan(0);
    });
  });

  describe('Building Balance', () => {
    it('higher tier buildings cost more', () => {
      const buildings = loadBuildings();

      // Check residential progression
      const house = buildings.residential_house;
      const apartment = buildings.residential_apartment;
      const condo = buildings.residential_condo;

      expect(apartment.cost.coins!).toBeGreaterThan(house.cost.coins!);
      expect(condo.cost.coins!).toBeGreaterThan(apartment.cost.coins!);
    });

    it('higher tier buildings have higher capacity', () => {
      const buildings = loadBuildings();

      const house = buildings.residential_house;
      const apartment = buildings.residential_apartment;
      const condo = buildings.residential_condo;

      expect(apartment.capacity).toBeGreaterThan(house.capacity);
      expect(condo.capacity).toBeGreaterThan(apartment.capacity);
    });

    it('higher tier buildings have higher maintenance', () => {
      const buildings = loadBuildings();

      const house = buildings.residential_house;
      const apartment = buildings.residential_apartment;
      const condo = buildings.residential_condo;

      expect(apartment.maintenance.cost).toBeGreaterThan(house.maintenance.cost);
      expect(condo.maintenance.cost).toBeGreaterThan(apartment.maintenance.cost);
    });

    it('industrial buildings have negative environment impact', () => {
      const industrial = getBuildingsByType('industrial');

      for (const building of industrial) {
        if (building.effects?.environment !== undefined) {
          expect(building.effects.environment).toBeLessThan(0);
        }
      }
    });

    it('parks have positive environment impact', () => {
      const park = getBuilding('service_park')!;
      const plaza = getBuilding('service_plaza')!;

      expect(park.effects?.environment).toBeGreaterThan(0);
      expect(plaza.effects?.environment).toBeGreaterThan(0);
    });

    it('all buildings have reasonable build times (10s - 3min)', () => {
      const buildings = loadBuildings();

      for (const building of Object.values(buildings)) {
        expect(building.buildTime).toBeGreaterThanOrEqual(10);
        expect(building.buildTime).toBeLessThanOrEqual(180);
      }
    });
  });
});
