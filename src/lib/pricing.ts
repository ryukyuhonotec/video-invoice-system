import { PricingRule, Partner } from "@/types";

export function calculatePrice(rule: PricingRule, durationInMinutes: number): number {
    if (rule.type === 'FIXED') {
        return rule.fixedPrice || 0;
    }

    // Handle STEPPED / LINEAR with possible increments
    let price = 0;

    // 1. Check Steps
    if (rule.steps && rule.steps.length > 0) {
        // Sort steps by duration just in case
        const sortedSteps = [...rule.steps].sort((a, b) => a.upTo - b.upTo);

        // Find the step that covers the duration
        // Example: duration 2.5, steps: 1, 2, 3. 2.5 <= 3. Match step 3.
        const matchedStep = sortedSteps.find(step => durationInMinutes <= step.upTo);

        if (matchedStep) {
            return matchedStep.price;
        } else {
            // Exceeds all steps.
            // If we have an increment logic, we use the last step as base + increments
            // If no increment logic, currently we might default to last step price or internal error.
            // Let's assume the max step price is the base for increment if threshold not set.
            const lastStep = sortedSteps[sortedSteps.length - 1];
            price = lastStep.price;
        }
    }

    // 2. Handle Increments
    // Generally triggered if duration > incrementThreshold
    // OR if duration > last step and no specific threshold set (implies last step is threshold)

    const threshold = rule.incrementThreshold ?? (rule.steps ? rule.steps[rule.steps.length - 1].upTo : 0);

    if (rule.incrementalUnitPrice && durationInMinutes > threshold) {
        const excessDuration = durationInMinutes - threshold;
        const unit = rule.incrementalUnit || 1;

        // Calculate how many units (ceil? floor? usually ceil for "per minute or part thereof")
        // "1分以降はいくらずつ" usually implies per started minute.
        const unitsToAdd = Math.ceil(excessDuration / unit);

        price += unitsToAdd * rule.incrementalUnitPrice;
    }

    return price;
}

export function calculatePartnerCost(partner: Partner, clientId: string | undefined, durationInMinutes: number): number {
    if (!partner.costRules || partner.costRules.length === 0) return 0;

    // 1. Find the best matching rule
    // Priority: Client Specific Rule > Generic Rule (no client ID)
    let rule = partner.costRules.find(r => r.clientId === clientId);

    if (!rule) {
        // Fallback to generic rule
        rule = partner.costRules.find(r => !r.clientId);
    }

    if (!rule) return 0;

    // 2. Calculate using the same logic as calculatePrice (since structures are compatible)
    // We treat PartnerCostRule as PricingRule for calculation purposes as they share structure
    return calculatePrice(rule as any as PricingRule, durationInMinutes);
}
