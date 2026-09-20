/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Reusable Servo Stabilizers product data and master configuration.
 * Contains all 29 variants across the 4 core product series:
 *  1. Oil Cooled Servo Controlled Voltage Stabilizers ('oil-master')
 *  2. Three Phase Servo Controlled Voltage Stabilizers ('air-master')
 *  3. Single Phase Servo Controlled Voltage Stabilizers ('iso-master')
 *  4. Constant Voltage Transformer ('cvt-master')
 */

export interface ProductSpecItem {
  label: string;
  value: string;
}

export interface ProductVariantData {
  price?: string;
  image: string;
  specs: ProductSpecItem[];
  features: string[];
}

export type ProductDatabaseType = Record<string, Record<string, ProductVariantData>>;

export interface MasterProductConfig {
  id: string;
  baseTitle: string;
  subtitle: string;
  badge: string;
  gridId: string | null;
  variants: (number | string)[];
  defaultVariant: number | string;
  description: string;
}

// EXACT PRODUCT DATABASE (29 variants)
export const productDatabase: ProductDatabaseType = {
  'cvt-master': {
    '1': {
      price: "Request Quote",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866543/voltrix_power_systems/cvt.png',
      specs: [
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '1 KVA' },
        { label: 'Phase', value: 'Single Phase' },
        { label: 'Type', value: 'Constant Voltage Transformer' },
        { label: 'Input Voltage', value: '170–270V' },
        { label: 'Output Voltage', value: '230V ±1%' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '95%' },
      ],
      features: [
        'Ideal for medical & lab equipment',
        'Noise filtering & spike suppression',
        'Instant voltage regulation'
      ]
    }
  },

  'oil-master': {
    '100': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866589/voltrix_power_systems/oil_cooled.png',
      specs: [
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '100 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Oil Immersed' },
        { label: 'Input Voltage', value: '340V - 480V' },
        { label: 'Output Voltage', value: '415V' },
        { label: 'Frequency', value: '60Hz' },
        { label: 'Minimum Order Quantity', value: '1 Piece' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Material', value: 'Mild Steel' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Ideal for textile looms & injection molding',
        'Superior thermal capacity for heavy loads',
        'Robust design for harsh environments'
      ]
    },
    '150': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866589/voltrix_power_systems/oil_cooled.png',
      specs: [
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '150 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Oil Immersed' },
        { label: 'Input Voltage', value: '340V - 480V' },
        { label: 'Output Voltage', value: '415V' },
        { label: 'Frequency', value: '60Hz' },
        { label: 'Minimum Order Quantity', value: '1 Piece' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Material', value: 'Mild Steel' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Longer MTBF for continuous operation',
        'Suitable for medium industrial plants',
        'High overload tolerance via oil cooling'
      ]
    },
    '200': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866589/voltrix_power_systems/oil_cooled.png',
      specs: [
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '200 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Oil Immersed' },
        { label: 'Input Voltage', value: '340V - 480V' },
        { label: 'Output Voltage', value: '415V' },
        { label: 'Frequency', value: '60Hz' },
        { label: 'Minimum Order Quantity', value: '1 Piece' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Material', value: 'Mild Steel' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Excellent vibration dampening (low noise)',
        'Suitable for hospital main feeds',
        'High regulation accuracy (±1%)'
      ]
    },
    '250': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866589/voltrix_power_systems/oil_cooled.png',
      specs: [
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '250 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Oil Immersed' },
        { label: 'Input Voltage', value: '340V - 480V' },
        { label: 'Output Voltage', value: '415V' },
        { label: 'Frequency', value: '60Hz' },
        { label: 'Minimum Order Quantity', value: '1 Piece' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Material', value: 'Mild Steel' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Designed for heavy rolling mills',
        'Zero waveform distortion',
        'Oil bath cooling for windings'
      ]
    },
    '300': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866589/voltrix_power_systems/oil_cooled.png',
      specs: [
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '300 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Oil Immersed' },
        { label: 'Input Voltage', value: '340V - 480V' },
        { label: 'Output Voltage', value: '415V' },
        { label: 'Frequency', value: '60Hz' },
        { label: 'Minimum Order Quantity', value: '1 Piece' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Material', value: 'Mild Steel' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Ideal for chemical plant sections',
        'Digital PLC/Servo control systems',
        'Handles frequent load spikes safely'
      ]
    },
    '350': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866586/voltrix_power_systems/oil_3.png',
      specs: [
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '350 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Oil Immersed' },
        { label: 'Input Voltage', value: '340V - 480V' },
        { label: 'Output Voltage', value: '415V' },
        { label: 'Frequency', value: '60Hz' },
        { label: 'Minimum Order Quantity', value: '1 Piece' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Material', value: 'Mild Steel' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Ideal for large datacenter chillers',
        'Robust protection against phase failure',
        'High thermal stability for continuous use'
      ]
    },
    '400': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866586/voltrix_power_systems/oil_3.png',
      specs: [
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '400 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Oil Immersed' },
        { label: 'Input Voltage', value: '340V - 480V' },
        { label: 'Output Voltage', value: '415V' },
        { label: 'Frequency', value: '60Hz' },
        { label: 'Minimum Order Quantity', value: '1 Piece' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Material', value: 'Mild Steel' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Central plant distribution ready',
        'Oil cooling reduces thermal stress',
        'Superior short-circuit protection'
      ]
    },
    '450': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866586/voltrix_power_systems/oil_3.png',
      specs: [
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '450 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Oil Immersed' },
        { label: 'Input Voltage', value: '340V - 480V' },
        { label: 'Output Voltage', value: '415V' },
        { label: 'Frequency', value: '60Hz' },
        { label: 'Minimum Order Quantity', value: '1 Piece' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Material', value: 'Mild Steel' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Designed for large process plants',
        'Radiators for effective heat dissipation',
        'Suitable for mission-critical loads'
      ]
    },
    '500': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866586/voltrix_power_systems/oil_3.png',
      specs: [
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '500 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Oil Immersed' },
        { label: 'Input Voltage', value: '340V - 480V' },
        { label: 'Output Voltage', value: '415V' },
        { label: 'Frequency', value: '60Hz' },
        { label: 'Minimum Order Quantity', value: '1 Piece' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Material', value: 'Mild Steel' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Primary feed for campus-scale sites',
        'Digital display with full diagnostics',
        'Maximum durability for 24/7 loads'
      ]
    }
  },

  'air-master': {
    '10': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866517/voltrix_power_systems/3_0.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '10 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Ambient Temperature', value: '45° Celsius' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '60 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 35V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Compact design for medical labs',
        'Low maintenance',
        'Fast response (<10ms)'
      ]
    },
    '15': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866517/voltrix_power_systems/3_0.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '15 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Ambient Temperature', value: '45° Celsius' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '60 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 35V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Ideal for retail & small servers',
        'Micro-controller precision ±1%',
        'Natural air cooled architecture'
      ]
    },
    '20': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866518/voltrix_power_systems/3_1.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '20 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Ambient Temperature', value: '45° Celsius' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '60 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 35V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Perfect for restaurant HVAC systems',
        'Wide input voltage range capability',
        'Lower weight & easier indoor siting'
      ]
    },
    '25': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866518/voltrix_power_systems/3_1.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '25 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Ambient Temperature', value: '45° Celsius' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '60 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 35V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Cost-effective for small CNCs',
        'High efficiency > 98%',
        'Quick installation in tight spaces'
      ]
    },
    '30': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866521/voltrix_power_systems/3_2.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '30 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Material', value: 'Mild Steel' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Control Type', value: 'Digital Controller' },
        { label: 'Frequency', value: '60 Hz' },
        { label: 'Output Voltage', value: '415V' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Mounting Type', value: 'Floor' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Suitable for telecom racks',
        'Micro-controller based circuit',
        'Handles office voltage swings'
      ]
    },
    '40': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866521/voltrix_power_systems/3_2.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '40 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '99%' },
        { label: 'Material', value: 'Mild Steel' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '60 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 40V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Forced air cooling with fans',
        'Ideal for printing & packaging',
        'Fast response to load changes'
      ]
    },
    '45': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866522/voltrix_power_systems/3_3.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '45 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Ambient Temperature', value: '45° Celsius' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '60 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 35V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Ideal for medium manufacturing lines',
        'Digital LCD display with alarms',
        'Overload & short-circuit protection'
      ]
    },
    '50': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866522/voltrix_power_systems/3_3.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '50 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Ambient Temperature', value: '45° Celsius' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '60 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 35V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Suitable for medical device suites',
        'Higher continuous current capacity',
        'Ventilated enclosure for heat management'
      ]
    },
    '60': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866525/voltrix_power_systems/3_5.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '60 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Ambient Temperature', value: '45° Celsius' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '60 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 35V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Excellent for medium data centers',
        'Fast voltage correction speed',
        'Protection against phase sequence errors'
      ]
    },
    '75': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866525/voltrix_power_systems/3_5.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '75 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Ambient Temperature', value: '45° Celsius' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '60 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 35V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Ideal for cold-storage compressor banks',
        'Micro-controller regulated output',
        'Automatic bypass option included'
      ]
    },
    '90': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866526/voltrix_power_systems/3_6.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '90 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Ambient Temperature', value: '45° Celsius' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '60 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 35V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Suitable for commercial building feeders',
        'High capacity forced air cooling',
        'Cost-effective large load solution'
      ]
    },
    '100': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866526/voltrix_power_systems/3_6.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '100 KVA' },
        { label: 'Phase', value: 'Three Phase' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '98%' },
        { label: 'Ambient Temperature', value: '45° Celsius' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '60 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 35V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Ideal for large server rooms',
        'Less maintenance than oil-cooled units',
        'Comprehensive thermal protection'
      ]
    }
  },

  'iso-master': {
    '1': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866511/voltrix_power_systems/1_1.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '1 KVA' },
        { label: 'Phase', value: 'Single Phase' },
        { label: 'Input Voltage', value: '160V - 260V' },
        { label: 'Output Voltage', value: '230V ± 1%' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '> 95%' },
        { label: 'Ambient Temperature', value: '0-45° Celsius' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '50 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 60V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Microprocessor based control circuit',
        'Digital display for Input/Output Voltage',
        'High voltage cut-off protection'
      ]
    },
    '2': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866511/voltrix_power_systems/1_1.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '2 KVA' },
        { label: 'Phase', value: 'Single Phase' },
        { label: 'Input Voltage', value: '160V - 260V' },
        { label: 'Output Voltage', value: '230V ± 1%' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '> 95%' },
        { label: 'Ambient Temperature', value: '0-45° Celsius' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '50 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 60V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Compact design suitable for homes',
        'Overload protection with auto-reset',
        'Zero waveform distortion'
      ]
    },
    '3': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866513/voltrix_power_systems/1_2.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '3 KVA' },
        { label: 'Phase', value: 'Single Phase' },
        { label: 'Input Voltage', value: '160V - 260V' },
        { label: 'Output Voltage', value: '230V ± 1%' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '> 95%' },
        { label: 'Ambient Temperature', value: '0-45° Celsius' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '50 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 60V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Ideal for treadmills and deep freezers',
        'Fast correction rate (>60V/sec)',
        'Short circuit protection (MCB)'
      ]
    },
    '5': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866513/voltrix_power_systems/1_2.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '5 KVA' },
        { label: 'Phase', value: 'Single Phase' },
        { label: 'Input Voltage', value: '160V - 260V' },
        { label: 'Output Voltage', value: '230V ± 1%' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '> 97%' },
        { label: 'Ambient Temperature', value: '0-45° Celsius' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '50 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 50V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Suitable for whole-house main line',
        'Bypass switch for uninterrupted supply',
        'High efficiency toroidal transformer'
      ]
    },
    '7.5': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866515/voltrix_power_systems/1_3.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '7.5 KVA' },
        { label: 'Phase', value: 'Single Phase' },
        { label: 'Input Voltage', value: '160V - 260V' },
        { label: 'Output Voltage', value: '230V ± 1%' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '> 97%' },
        { label: 'Ambient Temperature', value: '0-45° Celsius' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '50 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 50V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Perfect for large AC units (up to 4 ton)',
        'Digital LCD status display',
        'Heavy duty terminal connectors'
      ]
    },
    '10': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866515/voltrix_power_systems/1_3.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '10 KVA' },
        { label: 'Phase', value: 'Single Phase' },
        { label: 'Input Voltage', value: '160V - 260V' },
        { label: 'Output Voltage', value: '230V ± 1%' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '> 98%' },
        { label: 'Ambient Temperature', value: '0-45° Celsius' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '50 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 40V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Designed for small office/home office',
        'Intelligent time delay system',
        'Advanced thermal overload protection'
      ]
    },
    '15': {
      price: "10",
      image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866515/voltrix_power_systems/1_3.png',
      specs: [
        { label: 'Minimum Order Quantity', value: '1' },
        { label: 'Brand', value: 'Cyber' },
        { label: 'Power', value: '15 KVA' },
        { label: 'Phase', value: 'Single Phase' },
        { label: 'Input Voltage', value: '160V - 260V' },
        { label: 'Output Voltage', value: '230V ± 1%' },
        { label: 'Cooling', value: 'Air Cooled' },
        { label: 'Efficiency', value: '> 98%' },
        { label: 'Ambient Temperature', value: '0-45° Celsius' },
        { label: 'Surge Protection', value: 'With Surge Protection' },
        { label: 'Frequency', value: '50 Hz' },
        { label: 'Automation Grade', value: 'Automatic' },
        { label: 'Correction Speed', value: '> 40V/sec' },
        { label: 'Country of Origin', value: 'Made in India' }
      ],
      features: [
        'Suitable for large villas/duplex homes',
        'Robust chassis with castor wheels',
        'Precise output for sensitive electronics'
      ]
    }
  }
};

// MASTER CONFIG (4 Products metadata & variant ordering)
export const masterConfig: Record<string, MasterProductConfig> = {
  'oil-master': {
    id: 'oil-master',
    baseTitle: 'Oil Cooled Servo Controlled Voltage Stabilizers',
    subtitle: 'Heavy-Duty Industrial Voltage Regulation with Mineral Oil Immersed Cooling',
    badge: 'Three Phase // Heavy Industrial',
    gridId: 'grid-oil',
    variants: [100, 150, 200, 250, 300, 350, 400, 450, 500],
    defaultVariant: 100,
    description: 'Designed for harsh industrial environments, rolling mills, CNC factories, and large campus infrastructure with superior thermal endurance.'
  },
  'air-master': {
    id: 'air-master',
    baseTitle: 'Three Phase Servo Controlled Voltage Stabilizers',
    subtitle: 'High Precision Natural & Forced Air Cooled Three-Phase Voltage Correction',
    badge: 'Three Phase // Commercial & Industrial',
    gridId: 'grid-air',
    variants: [10, 15, 20, 25, 30, 40, 45, 50, 60, 75, 90, 100],
    defaultVariant: 10,
    description: 'Precision voltage stabilization for sensitive IT datacenters, diagnostic imaging equipment, printing presses, and commercial building feeders.'
  },
  'iso-master': {
    id: 'iso-master',
    baseTitle: 'Single Phase Servo Controlled Voltage Stabilizers',
    subtitle: 'Microprocessor Controlled High-Speed Correction for SOHO & Residential Mainlines',
    badge: 'Single Phase // Domestic & Commercial',
    gridId: 'grid-iso',
    variants: [1, 2, 3, 5, 7.5, 10, 15],
    defaultVariant: 1,
    description: 'Compact, high-speed correction stabilizers safeguarding villas, laboratories, refrigeration compressors, and sensitive home electronics.'
  },
  'cvt-master': {
    id: 'cvt-master',
    baseTitle: 'Constant Voltage Transformer',
    subtitle: 'Instant Ferro-Resonant Regulation with Complete Galvanic Isolation & Noise Filtering',
    badge: 'Single Phase // Ultra-Precision Medical & Lab',
    gridId: null,
    variants: [1],
    defaultVariant: 1,
    description: 'Instantaneous voltage correction without moving mechanical parts. Delivers total harmonic suppression for medical lab gear and analyzers.'
  }
};

/**
 * Resolves safe image URL, ensuring leading slash for Next.js public folder serving
 */
export function resolveImageUrl(imgPath: string): string {
  if (!imgPath) return 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866584/voltrix_power_systems/Oil_Cooled_Stabilizer.png';
  if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
  if (imgPath.startsWith('/')) return imgPath;
  return `/${imgPath}`;
}

/**
 * Helper to fetch a product's variant details with fallback
 */
export function getProductVariant(productId: string, variantKey: string | number): ProductVariantData | null {
  const prodGroup = productDatabase[productId];
  if (!prodGroup) return null;
  const data = prodGroup[String(variantKey)];
  if (data) return data;
  const firstKey = Object.keys(prodGroup)[0];
  return prodGroup[firstKey] || null;
}

/**
 * Returns formatted title for a given product and capacity
 */
export function getFormattedTitle(productId: string, variantKey: string | number): string {
  const cfg = masterConfig[productId];
  if (!cfg) return '';
  const variant = getProductVariant(productId, variantKey);
  const powerVal = variant?.specs.find(s => s.label === 'Power')?.value;
  if (powerVal) {
    return `${powerVal} ${cfg.baseTitle}`;
  }
  return `${variantKey} KVA ${cfg.baseTitle}`;
}

export interface MasterStabilizerCardInfo {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  description: string;
  inputRange: string;
  capacityRange: string;
  image: string;
  phase: string;
  cooling: string;
  variantsCount: number;
}

export const MASTER_STABILIZER_CARDS: MasterStabilizerCardInfo[] = [
  {
    id: 'oil-master',
    name: 'Oil Cooled Servo Controlled Voltage Stabilizers',
    subtitle: 'Heavy-Duty Industrial Voltage Regulation with Mineral Oil Immersed Cooling',
    badge: 'Three Phase // Heavy Industrial',
    description: 'Heavy-duty industrial voltage stabilizers submerged in thermal premium dielectric cooling oil to support continuous heavy loads up to 500 kVA.',
    inputRange: '340V - 480V',
    capacityRange: '100 - 500 KVA',
    image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866589/voltrix_power_systems/oil_cooled.png',
    phase: 'Three Phase',
    cooling: 'Oil Immersed',
    variantsCount: 9
  },
  {
    id: 'air-master',
    name: 'Three Phase Servo Controlled Voltage Stabilizers',
    subtitle: 'High Precision Natural & Forced Air Cooled Three-Phase Voltage Correction',
    badge: 'Three Phase // Commercial & Industrial',
    description: 'High precision air cooled three-phase stabilizers with digital microcontroller precision for commercial lines, servers, and printing presses.',
    inputRange: '340V - 480V',
    capacityRange: '10 - 100 KVA',
    image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866517/voltrix_power_systems/3_0.png',
    phase: 'Three Phase',
    cooling: 'Air Cooled',
    variantsCount: 12
  },
  {
    id: 'iso-master',
    name: 'Single Phase Servo Controlled Voltage Stabilizers',
    subtitle: 'Microprocessor Controlled High-Speed Correction for SOHO & Residential Mainlines',
    badge: 'Single Phase // Domestic & Commercial',
    description: 'Microprocessor-controlled single phase stabilizers engineered for residential main lines, deep freezers, laboratories, and sensitive electronics.',
    inputRange: '160V - 260V',
    capacityRange: '1 - 15 KVA',
    image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866511/voltrix_power_systems/1_1.png',
    phase: 'Single Phase',
    cooling: 'Air Cooled',
    variantsCount: 7
  },
  {
    id: 'cvt-master',
    name: 'Constant Voltage Transformer',
    subtitle: 'Instant Ferro-Resonant Regulation with Complete Galvanic Isolation & Noise Filtering',
    badge: 'Single Phase // Ultra-Precision Medical & Lab',
    description: 'Ferro-resonant constant voltage transformers providing instantaneous voltage regulation, noise filtering, and spike suppression.',
    inputRange: '170V - 270V',
    capacityRange: '1 KVA',
    image: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866543/voltrix_power_systems/cvt.png',
    phase: 'Single Phase',
    cooling: 'Air Cooled',
    variantsCount: 1
  }
];

export const MASTER_STABILIZER_SUB_PRODUCTS = MASTER_STABILIZER_CARDS.map(card => {
  const defaultVar = masterConfig[card.id]?.defaultVariant || 1;
  const vData = getProductVariant(card.id, defaultVar);
  const specsMap: Record<string, string> = {
    'Capacity': card.capacityRange,
    'Input': card.inputRange,
    'Phase': card.phase,
    'Cooling': card.cooling,
    'Capacity Range': card.capacityRange,
    'Input Range': card.inputRange,
    ...(vData ? Object.fromEntries(vData.specs.map(s => [s.label, s.value])) : {})
  };
  return {
    id: card.id,
    name: card.name,
    description: card.description,
    features: vData?.features || [],
    specs: specsMap,
    applications: ['Industrial Facilities', 'Commercial Feeder Lines', 'Medical & Laboratory', 'Residential Mainlines'],
    image: card.image
  };
});
