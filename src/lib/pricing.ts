import { PricingRule, Partner, PricingStep } from "@/types";

export function parseDuration(durationStr: string | number | undefined): number {
    if (!durationStr) return 0;
    if (typeof durationStr === 'number') return durationStr;

    // Check format "mm:ss"
    const parts = durationStr.split(':');
    if (parts.length === 2) {
        const min = parseInt(parts[0], 10);
        const sec = parseInt(parts[1], 10);
        if (!isNaN(min) && !isNaN(sec)) {
            return min + (sec / 60);
        }
    }

    // Fallback if just number in string
    const num = parseFloat(durationStr);
    return isNaN(num) ? 0 : num;
}

export function calculatePrice(rule: PricingRule, durationInput: number | string, side: 'revenue' | 'cost' = 'revenue'): number {
    const durationInMinutes = parseDuration(durationInput);

    if (rule.type === 'FIXED') {
        return (side === 'revenue' ? rule.fixedPrice : rule.fixedCost) || 0;
    }

    // Handle STEPPED / LINEAR
    let price = 0;

    // 1. Check Steps
    const rawSteps = side === 'revenue' ? rule.steps : rule.costSteps;
    let steps: PricingStep[] = [];
    if (typeof rawSteps === 'string') {
        try {
            steps = JSON.parse(rawSteps);
        } catch (e) {
            steps = [];
        }
    } else if (Array.isArray(rawSteps)) {
        steps = rawSteps;
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
    const revThreshold = rule.incrementThreshold ?? (stepsArr.length > 0 ? stepsArr[stepsArr.length - 1].upTo : 0);
    const costThreshold = rule.incrementalCostThreshold ?? (stepsArr.length > 0 ? stepsArr[stepsArr.length - 1].upTo : 0);
    const threshold = side === 'revenue' ? revThreshold : costThreshold;

    const unit = side === 'revenue' ? (rule.incrementalUnit || 1) : (rule.incrementalCostUnit || 1);
    const unitPrice = side === 'revenue' ? (rule.incrementalUnitPrice || 0) : (rule.incrementalCostPrice || 0);

    if (unitPrice && durationInMinutes > threshold) {
        const excessDuration = durationInMinutes - threshold;
        const unitsToAdd = Math.ceil(excessDuration / unit);
        price += unitsToAdd * unitPrice;
    }

    return price;
}

export function calculatePartnerCost(partner: Partner, clientId: string | undefined, durationInput: number | string): number {
    const durationInMinutes = parseDuration(durationInput);
    if (!partner.pricingRules || partner.pricingRules.length === 0) return 0;

    let rule = partner.pricingRules.find(r => r.clients?.some(c => c.id === clientId));
    if (!rule) rule = partner.pricingRules.find(r => !r.clients || r.clients.length === 0);
    if (!rule) return 0;

    return calculatePrice(rule, durationInMinutes, 'cost');
}
