export enum OfferType {
    CHECKING = "Checking",
    SAVINGS = "Savings",
    CREDIT_CARD = "Credit Card"
}

export interface Promotion {
    id: string;
    bank_name: string;
    offer_type: OfferType;
    bonus_amount: number;
    currency: string;
    description: string;
    promotion_url: string;
    min_deposit: number;
    min_balance: number;
    monthly_fees: number;
    direct_deposit_required: boolean;
    direct_deposit_amount: number;
    holding_period_days: number;
    score: number;
    score_breakdown: string;
}

export interface PromotionResponse {
    promotions: Promotion[];
}
