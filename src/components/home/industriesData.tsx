import React from 'react';

export interface QuickSpec {
  label: string;
  value: string;
}

export interface Industry {
  id: string;
  name: string;
  emoji: string;
  iconName: string;
  desc: string;
  longDesc: string;
  specs: string[];
  recommendedCategory: string;
  recommendedCategorySlug: string;
  systemLoadEst: string;
  standardsCompliance: string;
  imageUrl: string;
  quickSpecs: QuickSpec[];
}

export const INDUSTRIES_DATA: Industry[] = [
  {
    id: 'healthcare',
    name: 'Hospitals & Healthcare',
    emoji: '',
    iconName: 'Activity',
    desc: 'Bespoke continuous clean power backups and voltage correction systems safeguarding critical diagnostics and patient-care rooms.',
    longDesc: 'ICU departments, surgical suites, and advanced diagnostic scanners (CT/MRI) demand ultra-stable voltage lines with absolute zero-millisecond power grid transfer times. High-precision stabilizers and redundant Online UPS configurations protect lifesaving medical electronics.',
    specs: [
      'Static automatic bypass control with zero utility interruption transfer',
      'Dual parallel-redundant hot-swappable micro-controller modules',
      'Hospital-grade active copper isolation barriers suppressing EMI noise',
      'Instantaneous voltage regulation times measuring under 10 milliseconds'
    ],
    recommendedCategory: 'Hospital Servo Stabilizers & Redundant Online UPS',
    recommendedCategorySlug: 'servo-stabilizer',
    systemLoadEst: '50 kVA – 500 kVA continuous stabilization',
    standardsCompliance: 'IEC 60601-1 Medical Grid Integrity Compliance',
    imageUrl: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1783547878/voltrix_power_systems/regenerated_image_1780667370317.png',
    quickSpecs: [
      { label: 'Voltage Precision', value: '±0.5% ultra-narrow corridor' },
      { label: 'Noise Shielding', value: 'Electrostatic dual copper isolation' },
      { label: 'Safety Index', value: 'Level IV Life Support continuous standard' }
    ]
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing Industries',
    emoji: '',
    iconName: 'Factory',
    desc: 'Heavy industrial power conditioning built to sustain heavy robotic machinery, motorized conveyors, and automated assemblies.',
    longDesc: 'Continuous manufacturing, chemical processing, and robotic assembly lines are highly susceptible to voltage sags and phase imbalances. Industrial-grade stabilizers recommended by our partner networks are engineered to correct large startup load surges and phase unbalances.',
    specs: [
      'Phase-wise balancing rollers with heavy-duty carbon drive assemblies',
      'High overload tolerance of up to 150% sustained for conveyor motor starts',
      'Built-in lightning surge suppressors with phase reversal lockout protection',
      'Rugged powder-coated chassis designed to withstand heat and vibration'
    ],
    recommendedCategory: 'Three Phase Air/Oil Cooled Industrial Servo Stabilizers',
    recommendedCategorySlug: 'servo-stabilizer',
    systemLoadEst: '100 kVA – 2000 kVA structural capacity',
    standardsCompliance: 'IS 302-1 Electrical Safety & Machinery Standards',
    imageUrl: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1783547873/voltrix_power_systems/regenerated_image_1780667763552.png',
    quickSpecs: [
      { label: 'Transient Endurance', value: '150% sustained load spikes standard' },
      { label: 'Control Mechanics', value: 'Individual phase linear motorized correction' },
      { label: 'Chassis Integrity', value: 'IP-31 / IP-54 industrial grade cabinets' }
    ]
  },
  {
    id: 'commercial',
    name: 'Commercial & Residental Buildings',
    emoji: '',
    iconName: 'Building',
    desc: 'Centralized voltage balancing and electrical surge protection for skyscrapers, retail systems, and modern facilities.',
    longDesc: 'Corporate towers, smart business parks, and shopping malls experience localized power sags from commercial elevator operations and large-scale central air-conditioning systems. The recommended voltage balancing systems protect building electronics and HVAC loops.',
    specs: [
      'Unbalanced input voltage correction arrays tailored for mixed facilities',
      'Silent operations and small footprint for simple indoor installation',
      'High-capacity copper busbar configurations maximizing conductivity',
      'Automatic low and high voltage trip safeties to protect common areas'
    ],
    recommendedCategory: 'Three Phase Air Cooled Servo Stabilizers',
    recommendedCategorySlug: 'servo-stabilizer',
    systemLoadEst: '100 kVA – 1000 kVA infrastructure load',
    standardsCompliance: 'National Electrical Code (NEC) Building Code Compliant',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    quickSpecs: [
      { label: 'Thermal Resilience', value: 'Under 45°C full-load continuous heat dissipation' },
      { label: 'Correction Method', value: 'Phase-wise separate linear correction servo gears' },
      { label: 'Efficiency Index', value: '98.2% operating power efficiency' }
    ]
  },
  {
    id: 'datacenter',
    name: 'Data Centers',
    emoji: '',
    iconName: 'Server',
    desc: 'High-efficiency double-conversion online UPS systems supplying uninterrupted backup power for cloud servers.',
    longDesc: 'Cloud infrastructure hosts and enterprise data centers require flawless, clean energy lines to prevent storage read/write errors. Double-conversion online UPS setups deliver pure, filtered output lines 24/7 with zero milliseconds transfer times.',
    specs: [
      'Sinusoidal wave correction with less than 1% total harmonic distortion',
      '0.99 Active Input Power Factor matching green datacenter guidelines',
      'N+X active parallel redundant capability for flawless backup systems',
      'Remote SNMP monitoring cards allowing continuous cloud status metrics'
    ],
    recommendedCategory: 'Modular Three-Phase Online UPS Systems & Lithium Racks',
    recommendedCategorySlug: 'ups-systems',
    systemLoadEst: '30 kVA – 600 kVA redundant systems',
    standardsCompliance: 'TIA-942 Tier III and IV Datacenter Requirements',
    imageUrl: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1786746242/voltrix_power_systems/data_centers_industry.png',
    quickSpecs: [
      { label: 'Harmonic Distortion', value: '<1% THD at linear load environments' },
      { label: 'Transfer Latency', value: '0.00ms absolute gapless backup transit' },
      { label: 'Topology Core', value: 'Dual active IGBT insulated-gate architecture' }
    ]
  },
  {
    id: 'hospitality',
    name: 'Hotels & Hospitality',
    emoji: '',
    iconName: 'Hotel',
    desc: 'Uninterrupted power supplies and silent stabilizers for central kitchen appliances, elevators, and luxury climate control.',
    longDesc: 'Luxury hospitality relies on uninterrupted guest comfort. Elevator runs, washing systems, commercial kitchen lines, and centralized air systems must operate without microgrid flickering. Our power systems protect equipment and eliminate switching noise.',
    specs: [
      'Step-less voltage protection to prevent elevator compressor burnouts',
      'Silent operational design integrated into building facilities',
      'Automatic bypass mode aligning central emergency generator switches',
      'Corrosion-resistant dual bake powder coated steel cabinets'
    ],
    recommendedCategory: 'Three-Phase Linear Servo Correctors & Backup Inverters',
    recommendedCategorySlug: 'servo-stabilizer',
    systemLoadEst: '100 kVA – 500 kVA installation target',
    standardsCompliance: 'Commercial Hotel Safety & Electrical Regulations',
    imageUrl: 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1783547865/voltrix_power_systems/regenerated_image_1780680194368.png',
    quickSpecs: [
      { label: 'Operational Noise', value: 'Ameasured under 45dB from 1 meter distance' },
      { label: 'Environmental Guard', value: 'High Bake Anti-corrosive industrial finish' },
      { label: 'Load Versatility', value: 'Capable of handling reactive hotel load curves' }
    ]
  },
  {
    id: 'solar',
    name: 'Solar & Renewable Projects',
    emoji: '',
    iconName: 'Sun',
    desc: 'Smart hybrid solar storage tie-ins, MPPT power arrays, and heavy deep-cycle tubular backup storage cells.',
    longDesc: 'Renewable energy systems require stable bridges between varying solar currents and consumer operations. Our smart hybrid technology combined with MPPT tracking arrays maximizes solar utilization, providing clean stored backups.',
    specs: [
      'Heavy duty tubular batteries with over 1500 deep cycles life designs',
      'Intelligent pure sine wave inverters with parallel MPPT controllers',
      'Zero-loss transfer relays optimizing solar power first before grids',
      'Thermal runaway auto-trip disconnect alarms routing safety indicators'
    ],
    recommendedCategory: 'Solar PV Arrays, Hybrid Inverter Cabinets & Tubular Cells',
    recommendedCategorySlug: 'solar-solutions',
    systemLoadEst: '5 kWp – 150 kWp commercial solar clusters',
    standardsCompliance: 'MNRE and BIS Indian Renewable Standard Approved',
    imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    quickSpecs: [
      { label: 'Cell Longevity', value: '1500+ operational cycles at 80% discharge limit' },
      { label: 'MPPT Efficiency', value: '98.5% peak performance tracker efficiency' },
      { label: 'Standby Draw', value: 'Under 1% self-consumption idle drain' }
    ]
  }
];
