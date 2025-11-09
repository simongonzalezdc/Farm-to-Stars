/**
 * Township Civilization Integration
 *
 * Extends Homestead civilization data with Township-specific bonuses.
 * Each civilization's unique traits influence city-building gameplay.
 *
 * Based on lore from Docs/Lore/lore-implementation-analysis.md
 */

import type {
  TownshipCivilizationDefinition,
  TownshipCivilizationBonuses
} from '../../../types.township';
import type { CivilizationId } from '../../../types';

/**
 * Township-specific civilization bonuses
 *
 * Multipliers work like Homestead:
 * - 1.0 = no bonus
 * - 1.10 = +10% bonus
 * - 0.90 = -10% penalty
 */
const TOWNSHIP_CIVILIZATION_BONUSES: Record<CivilizationId, TownshipCivilizationBonuses> = {
  // ============================================================================
  // Teotihuacan Empire - Solar Technology Specialists
  // ============================================================================
  teotihuacan: {
    populationGrowth: 1.00, // Normal growth
    constructionSpeed: 1.15, // +15% faster building (solar-powered tools)
    happinessBonus: 0, // No base happiness bonus
    zoneCapacity: 1.00, // Normal capacity
    serviceCoverage: 1.10, // +10% service radius (solar power distribution)
    maintenanceCost: 0.95, // -5% maintenance (efficient solar energy)

    unique: {
      name: 'Solar Grid Mastery',
      description: 'Buildings with power service have extended range',
      effect: {
        powerRadius: 1.25 // +25% power coverage radius
      }
    }
  },

  // ============================================================================
  // Maya City-States - Knowledge & Astronomy Masters
  // ============================================================================
  maya: {
    populationGrowth: 1.05, // +5% growth (educated population attracts migrants)
    constructionSpeed: 1.00, // Normal construction
    happinessBonus: 10, // +10 base happiness (cultural sophistication)
    zoneCapacity: 1.10, // +10% capacity (efficient urban planning)
    serviceCoverage: 1.20, // +20% service radius (advanced infrastructure)
    maintenanceCost: 1.00, // Normal maintenance

    unique: {
      name: 'Observatory Network',
      description: 'Education buildings provide happiness bonus to nearby zones',
      effect: {
        educationHappiness: 15 // +15 happiness from education coverage
      }
    }
  },

  // ============================================================================
  // Moche Kingdoms - Water Efficiency Experts
  // ============================================================================
  moche: {
    populationGrowth: 1.00, // Normal growth
    constructionSpeed: 1.00, // Normal construction
    happinessBonus: 5, // +5 happiness (good water management)
    zoneCapacity: 1.00, // Normal capacity
    serviceCoverage: 1.15, // +15% service radius (water distribution networks)
    maintenanceCost: 0.90, // -10% maintenance (sustainable water systems)

    unique: {
      name: 'Aqueduct Mastery',
      description: 'Water service buildings cost less and serve larger areas',
      effect: {
        waterRadius: 1.40, // +40% water coverage radius
        waterCost: 0.75 // -25% cost for water infrastructure
      }
    }
  },

  // ============================================================================
  // Hopewell Commonwealth - Trade & Economy Focus
  // ============================================================================
  hopewell: {
    populationGrowth: 1.10, // +10% growth (trade routes attract people)
    constructionSpeed: 1.00, // Normal construction
    happinessBonus: 5, // +5 happiness (prosperous economy)
    zoneCapacity: 1.05, // +5% capacity
    serviceCoverage: 1.00, // Normal service radius
    maintenanceCost: 0.85, // -15% maintenance (efficient trade economy)

    unique: {
      name: 'Trade Network',
      description: 'Commercial zones generate additional coins and boost nearby happiness',
      effect: {
        commercialIncome: 1.25, // +25% income from commercial zones
        commercialHappiness: 10 // +10 happiness near commercial zones
      }
    }
  },

  // ============================================================================
  // Puebloan Federation - Sustainability Leaders
  // ============================================================================
  puebloan: {
    populationGrowth: 1.00, // Normal growth (quality over quantity)
    constructionSpeed: 0.95, // -5% construction (careful, sustainable building)
    happinessBonus: 15, // +15 happiness (sustainable, harmonious living)
    zoneCapacity: 1.15, // +15% capacity (efficient use of space)
    serviceCoverage: 1.10, // +10% service radius
    maintenanceCost: 0.80, // -20% maintenance (durable, sustainable buildings)

    unique: {
      name: 'Sustainable Architecture',
      description: 'Buildings have reduced environmental impact and higher durability',
      effect: {
        environmentBonus: 20, // +20 environment quality
        durability: 1.50 // +50% building durability
      }
    }
  }
};

/**
 * Advisor dialogue for each civilization
 *
 * These will be used by the UI/narrative systems (C3 bundle)
 */
const TOWNSHIP_ADVISOR_DIALOGUE: Record<
  CivilizationId,
  TownshipCivilizationDefinition['advisorDialogue']
> = {
  teotihuacan: {
    welcome:
      "Our ancestors built cities powered by the Sun. Now we bring that wisdom to this district. Let us construct a township worthy of the solar gods.",
    milestones: {
      '500_population':
        'The Sun shines favorably on our growth! Five hundred souls now call this district home.',
      '1000_population':
        'A thousand citizens! Our solar technology draws them like moths to flame.',
      '5000_population':
        'Five thousand strong! The pyramids of old would be proud of this achievement.'
    },
    warnings: {
      low_happiness: 'The people grow restless. Perhaps more solar-powered amenities would please them?',
      no_power: 'Without power, our technological advantage is lost. Build solar generators!',
      unemployment: 'Idle hands trouble the spirit. We must create more opportunities for work.'
    }
  },

  maya: {
    welcome:
      "Through centuries of astronomical study, we learned to plan cities with cosmic precision. Now we apply that knowledge here.",
    milestones: {
      '500_population': 'The stars align! Our district reaches five hundred citizens.',
      '1000_population':
        'One thousand souls! Our observatory reveals this is just the beginning of a golden age.',
      '5000_population': 'Five thousand! The calendar prophesied this prosperity.'
    },
    warnings: {
      low_happiness:
        'The celestial balance is disturbed. Our people need education and cultural enrichment.',
      no_education: 'Knowledge is our foundation. Build schools and observatories!',
      unemployment: 'Minds left idle grow discontent. Expand our commercial districts.'
    }
  },

  moche: {
    welcome:
      "From our homestead's terraced fields to this township's aqueducts, water flows through all we build. Let us channel it wisely.",
    milestones: {
      '500_population':
        'Like water filling a vessel, our population reaches five hundred. The aqueducts run clear.',
      '1000_population': 'One thousand citizens! Our water systems sustain them all efficiently.',
      '5000_population':
        'Five thousand! Our mastery of water has built a thriving oasis in the district.'
    },
    warnings: {
      low_happiness: 'The flow of contentment is blocked. Ensure all have access to clean water.',
      no_water: 'Water is life! Build wells and aqueducts to serve our people.',
      unemployment: 'Stagnant labor pools breed discontent. Create new opportunities.'
    }
  },

  hopewell: {
    welcome:
      "Trade routes that began at our homestead now expand into a township. Commerce brings prosperity to all.",
    milestones: {
      '500_population': 'Five hundred traders and artisans! The marketplace buzzes with activity.',
      '1000_population':
        'One thousand souls! Our trade networks attract merchants from across the land.',
      '5000_population':
        'Five thousand! This township has become a cornerstone of regional commerce.'
    },
    warnings: {
      low_happiness: 'Prosperity must be shared. Build more markets and public spaces.',
      unemployment: 'Empty shops diminish our trade. Expand commercial opportunities!',
      no_commercial: 'Commerce is our strength! Establish more trading districts.'
    }
  },

  puebloan: {
    welcome:
      "Our ancestors built cliff dwellings that stood for centuries. Now we bring that sustainable wisdom to township planning.",
    milestones: {
      '500_population':
        'Five hundred citizens living in harmony with their environment. Our ancestors smile.',
      '1000_population':
        'One thousand! Sustainable growth, not rapid expansion, brings true prosperity.',
      '5000_population':
        'Five thousand souls in balance! This township will endure for generations.'
    },
    warnings: {
      low_happiness:
        'Harmony is disrupted. Perhaps too much industry pollutes our environment?',
      environmental: 'Balance industry with nature. Our people value clean air and green spaces.',
      unemployment: 'All must contribute to the community. Expand work opportunities sustainably.'
    }
  }
};

/**
 * Get full Township civilization definition
 *
 * Merges Homestead bonuses with Township-specific data
 *
 * @param civilizationId - Civilization ID
 * @param homesteadBonuses - Bonuses from Homestead phase
 * @returns Complete Township civilization definition
 */
export function getTownshipCivilization(
  civilizationId: CivilizationId,
  homesteadBonuses: Record<string, number> = {}
): TownshipCivilizationDefinition {
  const townshipBonuses = TOWNSHIP_CIVILIZATION_BONUSES[civilizationId] ||
    TOWNSHIP_CIVILIZATION_BONUSES.teotihuacan;
  const dialogue = TOWNSHIP_ADVISOR_DIALOGUE[civilizationId] ||
    TOWNSHIP_ADVISOR_DIALOGUE.teotihuacan;

  // Civilization names
  const names: Record<CivilizationId, string> = {
    teotihuacan: 'Teotihuacan Empire',
    maya: 'Maya City-States',
    moche: 'Moche Kingdoms',
    hopewell: 'Hopewell Commonwealth',
    puebloan: 'Puebloan Federation'
  };

  return {
    id: civilizationId,
    name: names[civilizationId] || 'Unknown Civilization',
    homesteadBonuses,
    townshipBonuses,
    advisorDialogue: dialogue
  };
}

/**
 * Get all Township civilizations
 *
 * @returns Map of civilization ID to definition
 */
export function getAllTownshipCivilizations(): Record<CivilizationId, TownshipCivilizationDefinition> {
  const civIds: CivilizationId[] = ['teotihuacan', 'maya', 'moche', 'hopewell', 'puebloan'];

  return civIds.reduce((acc, id) => {
    acc[id] = getTownshipCivilization(id);
    return acc;
  }, {} as Record<CivilizationId, TownshipCivilizationDefinition>);
}

/**
 * Apply civilization-specific building cost modifier
 *
 * @param civilizationId - Civilization ID
 * @param buildingType - Type of building
 * @param baseCost - Base resource cost
 * @returns Modified cost
 */
export function applyCivilizationBuildingCost(
  civilizationId: CivilizationId,
  buildingType: string,
  baseCost: Record<string, number>
): Record<string, number> {
  const bonuses = TOWNSHIP_CIVILIZATION_BONUSES[civilizationId];
  if (!bonuses?.unique) return baseCost;

  // Moche water infrastructure discount
  if (civilizationId === 'moche' && buildingType.includes('water')) {
    const modifier = bonuses.unique.effect.waterCost || 1.0;
    return Object.fromEntries(
      Object.entries(baseCost).map(([resource, amount]) => [
        resource,
        Math.floor(amount * modifier)
      ])
    );
  }

  return baseCost;
}

/**
 * Get civilization-specific unique bonus value
 *
 * @param civilizationId - Civilization ID
 * @param bonusKey - Bonus effect key
 * @returns Bonus multiplier or 1.0 if not applicable
 */
export function getCivilizationUniqueBonus(
  civilizationId: CivilizationId,
  bonusKey: string
): number {
  const bonuses = TOWNSHIP_CIVILIZATION_BONUSES[civilizationId];
  if (!bonuses?.unique?.effect) return 1.0;

  return bonuses.unique.effect[bonusKey] ?? 1.0;
}
