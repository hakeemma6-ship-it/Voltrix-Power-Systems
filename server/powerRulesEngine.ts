/**
 * server/powerRulesEngine.ts
 * Hand-engineered rules engine to calculate sizing and system recommendation.
 */

export interface SizingInputs {
    productType: 'servo_stabilizer' | 'online_ups' | 'battery_bank' | 'solar_system';
    connectedLoadKw: number;
    phaseType: 'single_phase' | 'three_phase';
    inputVoltageMin?: number;
    inputVoltageMax?: number;
    applicationType?: 'industrial' | 'medical' | 'commercial' | 'residential';
    backupHours?: number;
    systemDcVoltage?: number;
}

export interface SizingDetails {
    productType: string;
    connectedLoadKw: number;
    requiredKvaOrCapacity: number;
    recommendedModelRating: string;
    coolingRecommendation: string;
    formulasUsed: string[];
    technicalNotes: string;
}

export function calculateSizingRecommendation(inputs: SizingInputs): SizingDetails {
    const {
        productType,
        connectedLoadKw,
        phaseType,
        applicationType = 'industrial',
        backupHours = 2,
        systemDcVoltage,
    } = inputs;

    const formulasUsed: string[] = [];
    let requiredKvaOrCapacity = 0;
    let recommendedModelRating = '';
    let coolingRecommendation = 'Natural air flow convection';
    let technicalNotes = '';

    // Determine safety/surge factor based on application
    let safetyFactor = 1.25;
    if (applicationType === 'medical') {
        safetyFactor = 2.0; // CT/MRI scanners need high offset
    } else if (applicationType === 'industrial') {
        safetyFactor = 1.5; // Motors have starting currents
    } else if (applicationType === 'residential') {
        safetyFactor = 1.2;
    }

    if (productType === 'servo_stabilizer') {
        const pf = 0.8;
        requiredKvaOrCapacity = (connectedLoadKw * safetyFactor) / pf;
        formulasUsed.push(`Safety Factor (SF) selected: ${safetyFactor}x for ${applicationType} application`);
        formulasUsed.push(`Standard Power Factor (PF): ${pf}`);
        formulasUsed.push(`Required kVA = (Connected Load ${connectedLoadKw} kW * SF ${safetyFactor}) / PF ${pf}`);

        // Round up to a standard range
        const standardSizes = [1, 2, 3, 5, 10, 15, 20, 25, 30, 45, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 3000];
        const recommendedKva = standardSizes.find(size => size >= requiredKvaOrCapacity) || requiredKvaOrCapacity;
        requiredKvaOrCapacity = parseFloat(requiredKvaOrCapacity.toFixed(2));
        recommendedModelRating = `Voltrix ${phaseType === 'three_phase' ? 'Three Phase' : 'Single Phase'} Servo Stabilizer — ${recommendedKva} kVA`;

        if (recommendedKva >= 50 && applicationType === 'industrial') {
            coolingRecommendation = 'Oil Cooled (Submerged in IS-335 premium thermal insulation fluid)';
            technicalNotes = 'Submerged oil winding is optimal for dusty, high humidity industrial sectors. Requires periodic oil inspections.';
        } else {
            coolingRecommendation = 'Air Cooled (Forced convection via dynamic thermal controlled axial fans)';
            technicalNotes = 'Air cooled units are compact and perfect for indoor diagnostic clinics, printing centers, and server racks.';
        }

        technicalNotes += ' Ensure neutral wire grounding is firmly connected to prevent severe neutral line drift.';

    } else if (productType === 'online_ups') {
        const pf = 0.9;
        requiredKvaOrCapacity = (connectedLoadKw * safetyFactor) / pf;
        formulasUsed.push(`Surge Buffer selected: ${safetyFactor}x for ${applicationType} environment`);
        formulasUsed.push(`Typical Online UPS Power Factor: ${pf}`);
        formulasUsed.push(`Required UPS kVA = (Connected Load ${connectedLoadKw} kW * SF ${safetyFactor}) / PF ${pf}`);

        const standardSizes = [1, 2, 3, 5, 6, 10, 15, 20, 30, 40, 60, 80, 100, 120, 160, 200, 300, 400, 500, 600, 800, 1000];
        const recommendedKva = standardSizes.find(size => size >= requiredKvaOrCapacity) || requiredKvaOrCapacity;
        requiredKvaOrCapacity = parseFloat(requiredKvaOrCapacity.toFixed(2));
        recommendedModelRating = `Voltrix DSP-Controlled Online UPS System — ${recommendedKva} kVA (Double Conversion)`;
        coolingRecommendation = 'Forced Air Tunnel cooling configuration with static bypass';
        technicalNotes = 'Provides absolute zero-millisecond static transfer failover. Suitable for rack cabinet integrations.';

    } else if (productType === 'battery_bank') {
        // Estimating reasonable DC voltage if not specified
        let dcVoltage = systemDcVoltage;
        if (!dcVoltage) {
            if (connectedLoadKw <= 2) dcVoltage = 12;
            else if (connectedLoadKw <= 5) dcVoltage = 24;
            else if (connectedLoadKw <= 15) dcVoltage = 48;
            else dcVoltage = 120;
        }

        const efficiency = 0.9; // 90% inverter efficiency
        const dod = 0.8;      // 80% Depth of discharge
        requiredKvaOrCapacity = (connectedLoadKw * 1000 * backupHours) / (dcVoltage * efficiency * dod);

        formulasUsed.push(`Target Backup Hours: ${backupHours} hrs`);
        formulasUsed.push(`Calculated DC bus voltage: ${dcVoltage}V DC`);
        formulasUsed.push(`Inverter Conversion Efficiency: ${efficiency * 100}%`);
        formulasUsed.push(`Recommended Depth of Discharge (DoD): ${dod * 100}%`);
        formulasUsed.push(`Required Ah = (Load ${connectedLoadKw * 1000}W * Backup ${backupHours}h) / (DC Bus ${dcVoltage}V * Eff ${efficiency} * DoD ${dod})`);

        const standardAhSizes = [7, 18, 26, 42, 65, 100, 120, 150, 180, 200];
        const recommendedAh = standardAhSizes.find(size => size >= requiredKvaOrCapacity) || requiredKvaOrCapacity;
        requiredKvaOrCapacity = parseFloat(requiredKvaOrCapacity.toFixed(2));
        recommendedModelRating = `Voltrix Deep-Cycle Battery Array — ${recommendedAh} Ah (at ${dcVoltage}V DC bank configuration)`;
        coolingRecommendation = 'Ambient natural cooling (well ventilated batteries compartment)';
        technicalNotes = 'Use sealed maintenance-free VRLA SMF cells for medical or server areas, and high-performance tall tubular cells for home/office sags.';

    } else if (productType === 'solar_system') {
        const solarLossesFactor = 1.3;
        requiredKvaOrCapacity = connectedLoadKw * solarLossesFactor;
        formulasUsed.push(`System Loss & Inefficiencies Overhead: ${Math.round((solarLossesFactor - 1) * 100)}%`);
        formulasUsed.push(`Required solar array capacity (kWp) = Connected Load ${connectedLoadKw} kW * Loss Override (${solarLossesFactor})`);

        requiredKvaOrCapacity = parseFloat(requiredKvaOrCapacity.toFixed(2));
        recommendedModelRating = `Voltrix Smart Hybrid Solar Solutions Array — ${requiredKvaOrCapacity} kWp panels`;
        coolingRecommendation = 'Natural back-ventilation array framing standard';
        technicalNotes = 'Includes dynamic MPPT solar charging controllers and net-metering configuration panels. Orientation should face southward at optimal tilt angle.';
    }

    return {
        productType,
        connectedLoadKw,
        requiredKvaOrCapacity,
        recommendedModelRating,
        coolingRecommendation,
        formulasUsed,
        technicalNotes,
    };
}
