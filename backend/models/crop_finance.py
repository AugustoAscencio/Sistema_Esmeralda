"""
Cálculos financieros ajustados por datos satelitales.
Todos los números son reproducibles y auditables.
"""
from dataclasses import dataclass

CROPS_DB = {
    "maiz":     {"price": 0.22, "cycle": 120, "water": 550,  "yield": 3500},
    "frijol":   {"price": 1.10, "cycle": 90,  "water": 350,  "yield": 1200},
    "arroz":    {"price": 0.35, "cycle": 130, "water": 1200, "yield": 4500},
    "tomate":   {"price": 0.45, "cycle": 90,  "water": 600,  "yield": 40000},
    "cafe":     {"price": 2.80, "cycle": 365, "water": 1500, "yield": 1500},
    "sorgo":    {"price": 0.18, "cycle": 100, "water": 400,  "yield": 3000},
    "yuca":     {"price": 0.15, "cycle": 270, "water": 800,  "yield": 18000},
    "platano":  {"price": 0.20, "cycle": 365, "water": 1200, "yield": 20000},
    "aguacate": {"price": 1.50, "cycle": 365, "water": 1000, "yield": 8000},
    "chile":    {"price": 1.20, "cycle": 90,  "water": 500,  "yield": 8000},
}


@dataclass
class CropFinancialPlan:
    crop: str
    area_ha: float
    ndvi_score: float       # 0–1 del satélite
    moisture_pct: float     # 0–100 del satélite
    market_price_usd: float

    def calculate(self) -> dict:
        d = CROPS_DB.get(self.crop, CROPS_DB["maiz"])

        # Factores de ajuste satelital
        ndvi_factor = 0.5 + self.ndvi_score * 0.8       # rango: 0.5× a 1.3×
        moisture_factor = 0.7 + (self.moisture_pct / 100) * 0.6

        expected_yield = d["yield"] * self.area_ha * ndvi_factor * moisture_factor
        gross_revenue = expected_yield * self.market_price_usd

        costs = {
            "semillas":     self.area_ha * 80,
            "fertilizante": self.area_ha * 120,
            "mano_obra":    self.area_ha * 200,
            "riego":        self.area_ha * 60 * (1 - self.moisture_pct / 200),
            "transporte":   gross_revenue * 0.05,
        }
        total_cost = sum(costs.values())
        net_profit = gross_revenue - total_cost
        roi_pct = (net_profit / total_cost * 100) if total_cost > 0 else 0

        # Crédito paramétrico
        resilience_factor = self.ndvi_score * 0.6 + self.moisture_pct / 100 * 0.4
        credit_amount = min(total_cost * 0.7, total_cost * resilience_factor)
        interest_rate = max(4.5, 15 - resilience_factor * 12)
        monthly_payment = (
            credit_amount * (interest_rate / 1200) /
            (1 - (1 + interest_rate / 1200) ** -12)
        ) if credit_amount > 0 else 0

        return {
            "crop": self.crop,
            "area_ha": self.area_ha,
            "satellite_adjustment_pct": round((ndvi_factor * moisture_factor - 1) * 100, 1),
            "expected_yield_kg": round(expected_yield),
            "gross_revenue_usd": round(gross_revenue, 2),
            "costs": {k: round(v, 2) for k, v in costs.items()},
            "total_cost_usd": round(total_cost, 2),
            "net_profit_usd": round(net_profit, 2),
            "roi_pct": round(roi_pct, 1),
            "break_even_price_usd_kg": round(total_cost / expected_yield, 4) if expected_yield > 0 else 0,
            "market_price_usd": self.market_price_usd,
            "credit": {
                "suggested_usd": round(credit_amount, 2),
                "interest_rate_pct": round(interest_rate, 1),
                "monthly_payment_usd": round(monthly_payment, 2),
            },
            "risk": "BAJO" if roi_pct > 30 else "MEDIO" if roi_pct > 10 else "ALTO",
        }


def compare_crops(area_ha: float, ndvi: float, moisture: float, prices: dict) -> list:
    """Compara rentabilidad de todos los cultivos para una parcela."""
    results = [
        CropFinancialPlan(
            crop, area_ha, ndvi, moisture,
            prices.get(crop, CROPS_DB[crop]["price"])
        ).calculate()
        for crop in CROPS_DB
    ]
    return sorted(results, key=lambda x: x["net_profit_usd"], reverse=True)


def drought_impact_analysis(crop: str, area_ha: float, drought_pct: int = 80) -> dict:
    """Simula impacto financiero de sequía progresiva."""
    scenarios = []
    for severity in range(0, drought_pct + 1, 10):
        moisture = max(0, 80 - severity * 0.8)
        ndvi = max(0.1, 0.7 - severity * 0.006)
        plan = CropFinancialPlan(
            crop, area_ha, ndvi, moisture,
            CROPS_DB.get(crop, CROPS_DB["maiz"])["price"]
        )
        result = plan.calculate()
        scenarios.append({
            "drought_pct":    severity,
            "moisture":       round(moisture, 1),
            "ndvi":           round(ndvi, 3),
            "net_profit_usd": result["net_profit_usd"],
            "yield_kg":       result["expected_yield_kg"],
            "credit_trigger": severity >= 40,
        })
    return {"crop": crop, "area_ha": area_ha, "scenarios": scenarios}
