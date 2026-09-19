/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface KnowledgeChunk {
  id: string;
  title: string;
  category: string;
  source: string;
  content: string;
}

export const KNOWLEDGE_BASE_CHUNKS: KnowledgeChunk[] = [
  {
    id: "kb_servo_01",
    title: "Servo Voltage Stabilizer Core Technology",
    category: "servo_stabilizer",
    source: "Servo Stabilizer Technical Manual - Section 1.1",
    content: "Voltrix Servo Stabilizers utilize microprocessor-controlled digital technology to deliver highly stable voltage. By continuously monitoring the input supply, the controller drives a heavy-duty buck-boost motorized copper winding assembly to adjust output voltage. Voltrix units achieve a true ±1.0% voltage regulation accuracy with zero output waveform distortion, rapid correction speeds of under 10 milliseconds, and peak operational efficiency of 98.5%."
  },
  {
    id: "kb_servo_02",
    title: "Air Cooled vs. Oil Cooled Servo Stabilizers Sizing and Selection",
    category: "servo_stabilizer",
    source: "Servo Stabilizer Sizing & Selection Guide",
    content: "The choice of stabilizer cooling depends on the operational environment and load capacity. Voltrix Air Cooled Stabilizers (available from 10kVA to 500kVA) are recommended for indoor clean environments such as diagnostic laboratories, precision CNC mills, and corporate server closets. Voltrix Oil Cooled Stabilizers (available from 50kVA to 2000kVA) are submerged in premium IS-335 thermal insulation oil and are ideal for dusty, hot, and heavy industrial environments like steel rolling mills, cement units, and foundry shops."
  },
  {
    id: "kb_servo_03",
    title: "Servo Stabilizer Winding Material and Carbon Brushes",
    category: "servo_stabilizer",
    source: "Servo Maintenance & Parts Specifications",
    content: "All premium Voltrix Servo Stabilizers are wound using 99.9% pure electrolytic grade copper to minimize copper losses and thermal de-rating. The motorized carbon brush assembly utilizes durable, self-lubricating carbon compounds that sweep smoothly across the toroidal autotransformer tracks. It is recommended to inspect the carbon brushes every 12 months in heavy-use industrial environments to check for wear and clean away carbon dust."
  },
  {
    id: "kb_ups_01",
    title: "Online Double-Conversion UPS Systems",
    category: "online_ups",
    source: "Online UPS Technical Specification - Section 2.1",
    content: "Voltrix Online UPS systems operate on a true double-conversion online architecture. The incoming AC power is first rectified to clean DC power, which both charges the battery bank and powers the solid-state inverter. The inverter reconstructs a perfect pure sine wave AC output (with <1.5% Total Harmonic Distortion). This double-conversion design provides true 0ms (zero-millisecond) static transfer failover time, completely isolating critical loads from sags, spikes, and brownouts."
  },
  {
    id: "kb_ups_02",
    title: "Industrial Modular UPS Redundancy",
    category: "online_ups",
    source: "Industrial UPS User Guide",
    content: "Voltrix Modular UPS systems support N+X parallel redundancy configuration, where 'N' is the required module count for the load, and 'X' represents standby backup modules. If any single module encounters a fault, the load is automatically distributed across the remaining active modules without power interruption. Standard modular options range from 10kVA to 500kVA, making them suitable for high-density IT closets, medical clinics, and industrial machinery grids."
  },
  {
    id: "kb_battery_01",
    title: "Deep-Cycle Tubular vs. VRLA SMF Batteries",
    category: "battery_bank",
    source: "Voltrix Battery Systems Documentation",
    content: "Voltrix offers two primary battery technologies for commercial and industrial backup systems. Deep-Cycle Tubular Lead-Acid batteries are highly durable and optimized for cyclic power outages, offering an extended operational life of 5-7 years with periodic distilled water topping. Sealed Maintenance-Free (VRLA SMF) batteries are completely sealed, require zero maintenance, can be mounted in any orientation, and are ideal for server racks and hospitals where acid fumes are prohibited."
  },
  {
    id: "kb_solar_01",
    title: "Solar Photovoltaic Grid-Tie and Hybrid Systems",
    category: "solar_system",
    source: "Solar Integration Manual - Section 4",
    content: "Voltrix Solar Solutions include grid-tie, off-grid, and hybrid PV systems up to 100kW capacities. Our hybrid intelligent solar inverters utilize advanced Maximum Power Point Tracking (MPPT) solar charge controllers to extract maximum solar energy from PV arrays. The system supports net-metering synchronization boards, allowing users to export excess solar energy back to the grid and reduce utility bills while maintaining battery backup for critical hours."
  },
  {
    id: "kb_install_01",
    title: "Electrical Installation and Neutral Earthing Guidelines",
    category: "installation_guides",
    source: "Voltrix Professional Installation Standard",
    content: "When installing Voltrix power equipment, ensure adequate clearance of at least 2 feet (60 cm) on all sides for optimal air ventilation. For stabilizer installations, neutral earthing is critical: the neutral wire must be securely grounded to prevent neutral drift, which can cause severe phase-to-neutral voltage imbalances. Standard copper cabling matching the rated current capacity must be used, and the input breaker should be rated 25% above the stabilizer's maximum input current."
  },
  {
    id: "kb_trouble_01",
    title: "Servo Stabilizer and UPS Troubleshooting FAQ",
    category: "troubleshooting_guides",
    source: "Voltrix Service & Troubleshooting Handbook",
    content: "Common issues and troubleshooting steps: 1. Over-Voltage Trip: Check if input voltage exceeds the designed input window. The system will automatically cut off to protect connected machinery. 2. Carbon Brush Sparking: Inspect carbon brushes for wear; replace if brush length is under 15mm. Clean the tracks with a soft, dry lint-free cloth. 3. UPS Beeping Alert: Indicates utility power fail (battery mode active), battery low (imminent shut-down), or overload."
  },
  {
    id: "kb_policy_01",
    title: "Voltrix Product Warranty and AMC Policies",
    category: "warranty_information",
    source: "Voltrix Customer Protection Policy",
    content: "All Voltrix Servo Stabilizers and Online UPS systems are backed by a comprehensive 1-year standard warranty covering all parts, labor, and onsite technical support. Customers can purchase an extended warranty (up to 3 years) or sign an Annual Maintenance Contract (AMC). AMCs include quarterly preventive health audits, carbon brush replacements, lubricating motorized chains, and thermal imaging of electrical contacts to prevent sags."
  },
  {
    id: "kb_faq_01",
    title: "Neutral Drift and Multi-Phase Protection",
    category: "faqs",
    source: "Voltrix Technical FAQ - Neutral Safeguards",
    content: "Neutral drift occurs in multi-phase grids when the neutral reference shifts, causing one phase to spike to dangerous voltages while another phase drops. Voltrix Stabilizers are equipped with dynamic multi-phase neutral drift protection cycles that constantly measure phase-to-neutral voltages. If a drift exceeding 15V is detected on any line, the system isolates the output within 20 milliseconds to prevent insulation breakdown in connected electronic devices."
  },
  {
    id: "kb_faq_02",
    title: "CT and MRI Scanner UPS Capacity Matching",
    category: "faqs",
    source: "Medical Imaging Power Compliance Brief",
    content: "High-surge diagnostic medical equipment, such as CT scanners and MRI machines, create momentary surge currents during scanning sequences that are 5 to 8 times their nominal running current. Sizing a UPS for these loads requires a 100% capacity matching overhead. For example, a 50kW MRI scanner requires a double-conversion online UPS of at least 100kVA rating to safely absorb inductive surges without triggering overload static bypass."
  }
];
