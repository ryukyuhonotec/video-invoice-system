import { PricingRule, Partner, PricingStep } from "@/types";

export function calculatePrice(rule: PricingRule, durationInMinutes: number): number {
    if (rule.type === 'FIXED') {
        return rule.fixedPrice || 0;
    }

    // Handle STEPPED / LINEAR with possible increments
    let price = 0;

    // 1. Check Steps
    let steps: PricingStep[] = [];
    if (typeof rule.steps === 'string') {
        try {
            steps = JSON.parse(rule.steps);
        } catch (e) {
            steps = [];
        }
    } else if (Array.isArray(rule.steps)) {
        steps = rule.steps;
    }

    if (steps.length > 0) {
        const sortedSteps = [...steps].sort((a, b) => a.upTo - b.upTo);
        const matchedStep = sortedSteps.find(step => durationInMinutes <= step.upTo);

        if (matchedStep) {
            return matchedStep.price;
        } else {
            const lastStep = sortedSteps[sortedSteps.length - 1];
            price = lastStep.price;
        }
    }

    // 2. Handle Increments
    const stepsArr = steps;
    const threshold = rule.incrementThreshold ?? (stepsArr.length > 0 ? stepsArr[stepsArr.length - 1].upTo : 0);

    if (rule.incrementalUnitPrice && durationInMinutes > threshold) {
        const excessDuration = durationInMinutes - threshold;
        const unit = rule.incrementalUnit || 1;
        const unitsToAdd = Math.ceil(excessDuration / unit);
        price += unitsToAdd * rule.incrementalUnitPrice;
    }

    return price;
}

export function calculatePartnerCost(partner: Partner, clientId: string | undefined, durationInMinutes: number): number {
    if (!partner.costRules || partner.costRules.length === 0) return 0;

    // 1. Find the best matching rule
    // Priority: Client Specific Rule > Generic Rule (no client selection)
    let rule = partner.costRules.find(r => r.clients?.some(c => c.id === clientId));

    if (!rule) {
        // Fallback to generic rule (no clients assigned)
        rule = partner.costRules.find(r => !r.clients || r.clients.length === 0);
    }

    if (!rule) return 0;

    // 2. Calculate using the same logic as calculatePrice (since structures are compatible)
    // We treat PartnerCostRule as PricingRule for calculation purposes as they share structure
    return calculatePrice(rule as any as PricingRule, durationInMinutes);
}
