/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlogPost, FAQ } from './types';

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "b1",
    title: "The Ultimate Guide to Selecting the Right Servo Voltage Stabilizer",
    slug: "servo-stabilizer-buying-guide",
    excerpt: "Learn how to calculate your machinery loads, understand input fluctuations, and decide between air cooled and oil cooled servo stabilizers to maximize equipment longevity.",
    content: `When purchasing a Servo Stabilizer for heavy machinery, any mismatch in capacity calculations, ambient temperature ratings, or cooling systems can lead to premature failure or insufficient protection.

This guide outlines the critical steps to design the perfect stabilization plan:

### 1. Calculate Your Combined Starting and Running Loads
Industrial electric motors, compressors, and CNC machines draw massive spike currents when starting up. 
• **Inductive Loads:** Standard motors can draw up to 3 to 5 times their running current on startup. Always factor in this 'Starting Surge' when selecting stabilizer capacity.
• **De-rating Criteria:** If your machine runs 12+ hours continuously, we strongly recommend choosing a stabilizer that operates at standard 70% capacity maximum, adding a 30% safety cushion.

### 2. Determine Your Site's Voltage Fluctuation History
Measure your local grid voltages across different parts of the day (morning loads vs. evening peaks). Custom units can be built and tailored to specific ranges:
• **Standard fluctuation band:** 300V to 470V input.
• **Extreme low-fluctuation band:** 260V to 470V input.
• **High fluctuation band:** 200V to 470V (requires wider buck-boost assemblies).

### 3. Deciding Between Air Cooled and Oil Cooled Formats
• **Choose Air Cooled if:** The machine resides in an indoor, climate-controlled setup, space is premium, or ease of relocatability on caster wheels is needed. Suitable up to 500 kVA.
• **Choose Oil Cooled if:** Your site has excessive dust, furnace emissions, corrosive gases, high humidity, or if the stabilizer is installed in open outdoor substations. Highly recommended for heavy environments above 100 kVA to 2000 kVA.

By planning with these boundaries, you ensure uninterrupted system efficiency and safety. Our engineering team and authorized dealer network can draft high-precision spec sheets to match your needs instantly.`,
    author: "Ir. Rajeev Sharma (Chief Technology Architect)",
    readTime: "6 mins read",
    publishedAt: "2026-04-18",
    tags: ["Stabilizers", "Industrial Power", "Buying Guide", "HVAC"],
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "b2",
    title: "5 Crucial Benefits of Installing a Digital Servo Stabilizer",
    slug: "servo-stabilizer-benefits",
    excerpt: "Discover how high-speed voltage stabilization directly drops electricity bills, prevents sensor decay, keeps industrial motors running cool, and secures complete neutral stability.",
    content: `Many commercial facility heads see stabilizers purely as insurance. However, modern digital servo stabilizers are highly advanced units that directly improve active operational efficiency.

Here are the top five benefits realized by installing these systems:

### 1. Exponential Drop in Active Energy Bills
When local grid voltage surges, your machinery and motors dissipate the excess voltage as wasted thermal energy. Statically operating motors at stable voltage lines (such as 415V or 230V flat lines) eliminates energy wastage, dropping absolute power bills by up to 12%.

### 2. Prevention of Electronic Micro-Controller Errors
Modern CNC lathes, injection molding arrays, and surgical equipment utilize sensitive micro-controllers. Voltage ripples above 5% cause random computer reboots, software execution errors, and circuit board failures. These units hold a strict tolerance profile under ±1.0%, keeping digital controllers extremely safe.

### 3. Substantially Lower Temperature Rise in Industrial Motors
Electric motors draw disproportionately higher currents when line voltage sags below threshold. This builds severe thermal stress within stator wind assemblies, aging the inner copper insulation. Keeping input voltage stabilized prevents overheating, doubling the operational motor service lives.

### 4. Direct Support for Massive Load Imbalance
In typical Commercial & Residental Buildings, distinct floors draw differing amounts of current across three phases. Individual phase servo engines stabilize each line independently, guarding against massive neutral-point shifts and keeping multi-phase power systems fully balanced.

### 5. Consolidated Protection and Automated Diagnostics
Equipped with dynamic micro-controllers, our telemetry registers high/low cuts, overloads, single phasing, and phase-reverse faults on an LCD grid, ensuring complete diagnostics control. Our systems are ready for B2B smart building networks.`,
    author: "Dr. S. K. Nair (Energy Audit Consultant)",
    readTime: "4 mins read",
    publishedAt: "2026-05-10",
    tags: ["Energy Saving", "Microprocessors", "Industrial Safety", "Servo Dynamics"],
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "b3",
    title: "Common Industrial Voltage Problems and High-Attenuation Solutions",
    slug: "voltage-problems-solutions",
    excerpt: "Spikes, ground noise, harmonic distortions, and severe phase shifts can halt active operations. Learn to diagnose and treat these chronic grid bugs.",
    content: `Electrical grids carry a wide array of raw noise, harmonic interferences, and surges. These issues often sneak past standard fuses and trip mechanisms, leading to expensive equipment damage.

Let's review the main issues and how specialized shielding systems resolve them completely:

### 1. Transient Voltage Spikes and Surge Anomalies
Lightning discharges, industrial capacitor switching, or local grid switching create microsecond voltage pulses that can reach up to 6000V.
• **The Solution:** Advanced servo stabilizers and voltage systems utilize multi-stage metal-oxide varistors (MOVs) paired with high-energy surge arrestors to absorb and neutralize high-energy spikes.

### 2. High Frequency Ground Loop Electrical Noise
Heavy machinery switching creates high-frequency common-mode noise between neutral lines and earth connections. This noise scrambles precision measurements in hospital ECG networks and leads to false cuts in CNC mills.
• **The Solution:** Installing double-shielded copper regulators. The dual electrostatic copper shields reflect common-mode noise spikes back to the ground line, delivering an exceptional noise attenuation profile up to 140 dB.

### 3. Input Over/Under Voltages (Sags and Swells)
Continuous voltage sag below 180V (single phase) or swells exceeding 260V can occur during heavy grid loading.
• **The Solution:** Heavy-duty motorized servo regulation. The carbon brush buck-boost system smoothly moves contact positions across toroidal variable auto-regulators, keeping the voltage flat without interrupting supply waves.

If you are noticing chronic machine trips or warm power cables, scheduling a consultation via our AMC support line allows our field engineers to perform diagnostic analysis of your site's harmonics and supply quality.`,
    author: "Ananya Sen (Chief Validation Officer)",
    readTime: "8 mins read",
    publishedAt: "2026-05-15",
    tags: ["Electrical Engineering", "Harmonics", "Isolation", "System Management"],
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "b4",
    title: "Practical Energy Saving Tips for Commercial Units",
    slug: "energy-saving-tips",
    excerpt: "Simple power habits, power factor optimization, stabilized commercial grids, and load balancing that instantly shave dollars off business overheads.",
    content: `Energy overheads account for roughly 15% to 35% of total energy costs in precision setups. Minimizing power wastes directly improves profit margins.

Here are four solid actionable steps you can execute today to save significant power:

### 1. Maximize and Manage Power Factor (PF) Correction
Operating inductive machinery without adequate capacitor banks introduces heavy reactive currents. This lags power factor down towards 0.75, incurring penalty fees from regional utility providers.
• **Action:** Install smart Automatic Power Factor Correction (APFC) systems alongside your distribution setups. Aim for a PF value above 0.98.

### 2. Connect Voltage Stabilization Directly at the Main Incomer
Running your entire equipment feed on a stabilized 415V three-phase network keeps supply voltage optimal for all secondary motors and blowers, dropping heat-generation loss across cables and switches.

### 3. Conduct Thermography Inspections on Main Distribution Panels
Over time, constant heating-cooling cycles cause electrical joints and lugs inside panels to loosen. Loose connections create localized contact resistance, generating intense heat and wasting power.
• **Action:** Schedule annual thermal imagers inspections of panels. Loose joints stand out clearly as high thermal anomalies, indicating points of wastage and fire hazards.

### 4. Transition to Smart VFD (Variable Frequency Drives)
Standard industrial pumps and air cooling blowers run continuously at full speeds, throttling air valves mechanically to control output flows.
• **Action:** Connect VFDs to feed motors. This regulates speeds digitally to match active pressure需求, dropping pump energy usage by up to 30%.

Our enterprise support team routinely conducts energy audits for registered dealers, enabling operations to scale efficiency. Contact our team to request a diagnostic panel audit.`,
    author: "Ir. Vikram Malhotra (Senior Sustainability Specialist)",
    readTime: "5 mins read",
    publishedAt: "2026-05-20",
    tags: ["Sustainability", "Power Factor", "Motors", "Energy Audit"],
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80"
  }
];

export const GENERAL_FAQS: FAQ[] = [
  {
    id: "f1",
    question: "What is the difference between air-cooled and oil-cooled servo stabilizers?",
    answer: "Air-cooled stabilizers use forced-air fans to cool the inner variable toroids and buck-boost regulators, making them perfect for clean, dust-free indoor rooms. Oil-cooled stabilizers are fully submerged in standard insulating oil for cooling and electrical insulation, making them highly durable and ideal for heavy-polluted sites, steel works, chemical installations, or outdoor substations.",
    category: "Technical"
  },
  {
    id: "f2",
    question: "Why should we install an Online UPS system if we already have a servo stabilizer?",
    answer: "A servo stabilizer corrects slow utility voltage sags and surges, stabilizing standard grid supplies over time. An Online double-conversion UPS system provides battery backup with absolutely zero transition delay (0 milliseconds), ensuring systems like server racks and laboratory chromatographs do not reboot during complete power drops.",
    category: "Technical"
  },
  {
    id: "f3",
    question: "How do I sign up as an authorized retail/industrial dealer?",
    answer: "Use our 'Dealer Portal' in the main navigation. Enter your company's registration details, location, operational scale, GSTIN (optional), and contact info to request access. Our regional admin team will review your application and approve your credentials. Once approved, you can instantly log in, generate custom client quotations, track orders, and view dealer growth incentives.",
    category: "Portal"
  },
  {
    id: "f4",
    question: "What is the typical technical support response window?",
    answer: "Our priority engineering response window is under 4 hours for certified scale and partner installations. Technical help teams operate 24/7. We also offer extended support plans through active maintenance contracts.",
    category: "Technical Support"
  },
  {
    id: "f5",
    question: "How do I register an active service complaint or register AMC support?",
    answer: "In the 'Services' section, select 'Complaint Registration' or 'AMC Support'. Provide your system's serial number, company details, issue details, and your preferred service date. A certified service ticket will be instantly generated and visible in the Admin Panel core system for regional scheduling.",
    category: "Technical Support"
  }
];
