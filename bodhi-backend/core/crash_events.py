"""
core/crash_events.py
Defines real historical crash events with verified NSE dates.
Also contains analytics helpers: alpha score, drawdown, volatility.
"""

import numpy as np
import pandas as pd
from typing import Optional

# ── Real historical crash events ───────────────────────────────────────────
CRASH_EVENTS: dict[str, dict] = {
    "covid_2020": {
        "id":          "covid_2020",
        "name":        "COVID Crash 2020",
        "emoji":       "🦠",
        "start":       "2020-01-15",
        "bottom":      "2020-03-23",   # Nifty hit 7,610 — actual bottom
        "recovery":    "2020-12-31",
        "description": "Nifty fell 38% in 40 trading days. Fastest crash in NSE history.",
        "lesson":      "Panic selling at the bottom locked in permanent loss. Holding recovered fully within 9 months.",
        "nifty_fall_pct": -38.0,
    },
    "demonetization_2016": {
        "id":          "demonetization_2016",
        "name":        "Demonetisation Shock 2016",
        "emoji":       "💵",
        "start":       "2016-11-01",
        "bottom":      "2016-12-26",
        "recovery":    "2017-05-01",
        "description": "Overnight 86% of currency notes invalidated. Nifty dropped 15% in 7 weeks.",
        "lesson":      "Short-term panic; long-term non-event. Recovery took under 6 months.",
        "nifty_fall_pct": -15.0,
    },
    "dotcom_2000": {
        "id":          "dotcom_2000",
        "name":        "Dotcom Crash 2000–2002",
        "emoji":       "💻",
        "start":       "2000-02-01",
        "bottom":      "2001-09-21",
        "recovery":    "2003-06-01",
        "description": "Indian tech stocks lost 70–90% of value. Sensex halved.",
        "lesson":      "Concentrated tech exposure was lethal. Diversified investors recovered far faster.",
        "nifty_fall_pct": -55.0,
    },
    "global_financial_crisis_2008": {
        "id":          "global_financial_crisis_2008",
        "name":        "Global Financial Crisis 2008",
        "emoji":       "🏦",
        "start":       "2008-01-01",
        "bottom":      "2008-10-27",
        "recovery":    "2010-09-01",
        "description": "Nifty crashed 60% from peak. Worst global recession since 1929.",
        "lesson":      "SIP investors who continued buying at the bottom 3x'd their money by 2014.",
        "nifty_fall_pct": -60.0,
    },
    "russia_ukraine_2022": {
        "id":          "russia_ukraine_2022",
        "name":        "Russia–Ukraine Selloff 2022",
        "emoji":       "⚡",
        "start":       "2022-01-15",
        "bottom":      "2022-06-17",
        "recovery":    "2022-11-01",
        "description": "Rising inflation + war fear. Nifty corrected ~17% before rebounding.",
        "lesson":      "Geopolitical panic rarely lasts. Market priced in the worst within months.",
        "nifty_fall_pct": -17.0,
    },
    "adani_crisis_2023": {
        "id":          "adani_crisis_2023",
        "name":        "Hindenburg–Adani Crisis 2023",
        "emoji":       "📉",
        "start":       "2023-01-24",
        "bottom":      "2023-03-01",
        "recovery":    "2023-08-01",
        "description": "Short-seller report wiped ₹12L Cr from Adani group. Broader market dipped 5%.",
        "lesson":      "Stock-specific risk vs index risk are very different. Nifty barely blinked.",
        "nifty_fall_pct": -5.0,
    },
}


def list_crash_events() -> list[dict]:
    """Return crash event metadata (no price data) for UI display."""
    return [
        {k: v for k, v in event.items() if k not in ("start", "bottom", "recovery")}
        for event in CRASH_EVENTS.values()
    ]


# ── Analytics helpers ───────────────────────────────────────────────────────

def compute_max_drawdown(prices: pd.Series) -> float:
    """Maximum peak-to-trough decline as a percentage."""
    rolling_max = prices.cummax()
    drawdown = (prices - rolling_max) / rolling_max
    return round(float(drawdown.min()) * 100, 2)


def compute_volatility_annualized(prices: pd.Series) -> float:
    """Annualized volatility (std of log returns × √252)."""
    log_returns = np.log(prices / prices.shift(1)).dropna()
    vol = float(log_returns.std() * np.sqrt(252)) * 100
    return round(vol, 2)


def compute_alpha_score(
    gain_pct: float,
    volatility: float,
    max_drawdown: float,
    recovery_speed_days: int,
) -> int:
    """
    Proprietary 0–100 BODHI alpha score.
    Weights: return (40%) + risk-adjusted return (30%) + recovery (30%).
    """
    # Return component (40 pts max)
    return_score = min(40, max(0, gain_pct / 2))

    # Risk-adjusted return — Sharpe-like (30 pts max)
    risk_free = 7.0  # approximate Indian 10Y yield
    excess = gain_pct - risk_free
    sharpe_proxy = excess / max(volatility, 1)
    sharpe_score = min(30, max(0, sharpe_proxy * 5))

    # Recovery speed (30 pts max — faster = better)
    # 30 days → 30 pts, 365 days → 0 pts
    recovery_score = min(30, max(0, 30 - (recovery_speed_days / 365) * 30))

    raw = return_score + sharpe_score + recovery_score

    # Drawdown penalty: subtract up to 20 pts for heavy drawdown
    penalty = min(20, abs(max_drawdown) / 5)

    return min(100, max(0, round(raw - penalty)))


def compute_what_if(
    portfolio_value: float,
    starting_capital: float,
) -> Optional[dict]:
    """Placeholder — returns None; populated by the router with real alternatives."""
    return None