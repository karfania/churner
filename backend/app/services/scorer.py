from app.models.domain import Promotion

class Scorer:
    @staticmethod
    def calculate_score(promo: Promotion) -> Promotion:
        score = 0.0
        breakdown = []

        # 1. ROI (Return on Investment) - Weighted 40%
        investment_needed = max(promo.min_deposit, promo.min_balance)
        
        roi_score = 0.0
        if investment_needed == 0:
            roi_score = 40.0
            breakdown.append("Infinite ROI (No deposit required) (+40)")
        else:
            roi = (promo.bonus_amount / investment_needed) * 100
            roi_score = min(roi * 0.8, 40.0)
            breakdown.append(f"ROI of {roi:.1f}% (+{roi_score:.1f})")
        
        score += roi_score

        # 2. Bonus Amount - Weighted 30%
        amount_score = min(promo.bonus_amount / 33.3, 30.0)
        score += amount_score
        breakdown.append(f"Bonus amount ${promo.bonus_amount} (+{amount_score:.1f})")

        # 3. Fees - Weighted 15%
        if promo.monthly_fees == 0:
            score += 15
            breakdown.append("No monthly fees (+15)")
        else:
            if promo.monthly_fees < 10:
                score += 5
                breakdown.append(f"Low monthly fees ${promo.monthly_fees} (+5)")
            else:
                breakdown.append(f"Monthly fees ${promo.monthly_fees} (+0)")

        # 4. Ease of Entry - Weighted 15%
        ease_score = 0
        if not promo.direct_deposit_required:
            ease_score += 10
            breakdown.append("No direct deposit required (+10)")
        elif promo.direct_deposit_amount < 1000:
            ease_score += 5
            breakdown.append(f"Low direct deposit requirement ${promo.direct_deposit_amount} (+5)")
        
        if promo.holding_period_days <= 90:
            ease_score += 5
            breakdown.append(f"Short holding period {promo.holding_period_days} days (+5)")
        
        score += ease_score

        final_score = max(0.0, min(100.0, score))
        promo.score = round(final_score, 1)
        promo.score_breakdown = "; ".join(breakdown)
        
        return promo
