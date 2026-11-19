"""Usage + spend limits.

GET /v1/usage returns synthesized series at the requested granularity. The
mock interpolates the seeded daily aggregates so charts have something
plausible to render even at an hourly granularity.
"""
from __future__ import annotations

import hashlib
import math
import random
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from store import store

router = APIRouter(prefix="/v1", tags=["usage"])


Granularity = Literal["hour", "day"]


def _parse_iso(s: str) -> datetime:
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "type": "invalid_argument",
                    "message": f"Could not parse '{s}' as ISO-8601 datetime.",
                }
            },
        )


def _daily_lookup() -> dict[str, dict]:
    return {row["date"]: row for row in store.usage_daily()}


def _hourly_factor(hour: int, salt: str) -> float:
    """Returns a 0..1ish factor with a daytime peak. Deterministic per (date,hour)."""
    h = int(hashlib.md5(f"{salt}-{hour}".encode()).hexdigest(), 16)
    rng = random.Random(h)
    base = 0.4 + 0.6 * math.sin((hour - 4) / 24 * math.pi)
    base = max(0.1, base)
    return base * (0.85 + rng.random() * 0.3)


@router.get("/usage")
async def get_usage(
    start: str = Query(..., description="ISO-8601 start (inclusive)"),
    end: str = Query(..., description="ISO-8601 end (exclusive)"),
    granularity: Granularity = Query("day"),
    api_key_id: str | None = Query(None, description="Filter to a single key"),
    model: str | None = Query(None, description="Filter to a single model"),
):
    start_dt = _parse_iso(start)
    end_dt = _parse_iso(end)
    if end_dt <= start_dt:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "type": "invalid_argument",
                    "message": "`end` must be after `start`.",
                }
            },
        )

    daily = _daily_lookup()
    series: list[dict] = []

    if granularity == "day":
        cur = start_dt.replace(hour=0, minute=0, second=0, microsecond=0)
        while cur < end_dt:
            key = cur.date().isoformat()
            row = daily.get(key)
            if row:
                series.append(
                    {
                        "ts": cur.astimezone(timezone.utc).isoformat().replace(
                            "+00:00", "Z"
                        ),
                        "requests": row["requests"],
                        "input_tokens": row["input_tokens"],
                        "output_tokens": row["output_tokens"],
                        "spend_usd": row["spend_usd"],
                    }
                )
            else:
                series.append(
                    {
                        "ts": cur.astimezone(timezone.utc).isoformat().replace(
                            "+00:00", "Z"
                        ),
                        "requests": 0,
                        "input_tokens": 0,
                        "output_tokens": 0,
                        "spend_usd": 0.0,
                    }
                )
            cur += timedelta(days=1)
    else:  # hour
        cur = start_dt.replace(minute=0, second=0, microsecond=0)
        while cur < end_dt:
            day_key = cur.date().isoformat()
            row = daily.get(day_key)
            factor = _hourly_factor(cur.hour, day_key)
            # Normalize so the 24 hours of factors roughly sum to ~12 (so each
            # hour is ~1/12th of the day, averaging out).
            factor = factor / 12.0
            base = row or {"requests": 0, "input_tokens": 0, "output_tokens": 0, "spend_usd": 0.0}
            series.append(
                {
                    "ts": cur.astimezone(timezone.utc).isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "requests": int(base["requests"] * factor),
                    "input_tokens": int(base["input_tokens"] * factor),
                    "output_tokens": int(base["output_tokens"] * factor),
                    "spend_usd": round(base["spend_usd"] * factor, 4),
                }
            )
            cur += timedelta(hours=1)

    # Apply soft filters — the mock doesn't track per-key/per-model breakdowns
    # in the seed data, so we just scale things deterministically.
    if api_key_id or model:
        salt = f"{api_key_id or ''}|{model or ''}"
        h = int(hashlib.md5(salt.encode()).hexdigest(), 16)
        scale = 0.15 + (h % 70) / 100.0  # 0.15..0.84
        for row in series:
            row["requests"] = int(row["requests"] * scale)
            row["input_tokens"] = int(row["input_tokens"] * scale)
            row["output_tokens"] = int(row["output_tokens"] * scale)
            row["spend_usd"] = round(row["spend_usd"] * scale, 4)

    totals = {
        "requests": sum(r["requests"] for r in series),
        "input_tokens": sum(r["input_tokens"] for r in series),
        "output_tokens": sum(r["output_tokens"] for r in series),
        "spend_usd": round(sum(r["spend_usd"] for r in series), 4),
    }

    return {
        "object": "usage_report",
        "start": start,
        "end": end,
        "granularity": granularity,
        "filters": {"api_key_id": api_key_id, "model": model},
        "series": series,
        "totals": totals,
    }


def _consumer_weights(candidates: list[dict], metric: str) -> list[int]:
    return [
        100
        + int(
            hashlib.md5(
                f"{candidate['api_key_id']}|{candidate['model']}|{metric}".encode()
            ).hexdigest(),
            16,
        )
        % 900
        for candidate in candidates
    ]


def _allocate_integer(total: int, weights: list[int]) -> list[int]:
    weight_total = sum(weights)
    raw = [total * weight / weight_total for weight in weights]
    values = [math.floor(value) for value in raw]
    remainder = total - sum(values)
    remainder_order = sorted(
        range(len(raw)),
        key=lambda index: raw[index] - values[index],
        reverse=True,
    )
    for index in remainder_order[:remainder]:
        values[index] += 1
    return values


def _allocate_decimal(total: float, weights: list[int]) -> list[float]:
    weight_total = sum(weights)
    values = [round(total * weight / weight_total, 4) for weight in weights]
    values[-1] = round(values[-1] + total - sum(values), 4)
    return values


@router.get("/usage/consumers")
async def get_usage_consumers(
    start: str = Query(..., description="ISO-8601 start (inclusive)"),
    end: str = Query(..., description="ISO-8601 end (exclusive)"),
    granularity: Granularity = Query("day"),
    api_key_id: str | None = Query(None, description="Filter to a single key"),
    model: str | None = Query(None, description="Filter to a single model"),
):
    report = await get_usage(start, end, granularity, api_key_id, model)
    keys = [
        key for key in store.api_keys()
        if api_key_id is None or key["id"] == api_key_id
    ]
    models = [
        model_record for model_record in store.models()
        if model is None or model_record["id"] == model
    ]
    candidates = [
        {
            "api_key_id": key["id"],
            "api_key_name": key["name"],
            "credential": f"{key['prefix']}••••{key['last_four']}",
            "model": model_record["id"],
        }
        for key in keys
        for model_record in models
    ]

    if not candidates:
        data: list[dict] = []
    else:
        totals = report["totals"]
        allocations = {
            "requests": _allocate_integer(
                totals["requests"], _consumer_weights(candidates, "requests")
            ),
            "input_tokens": _allocate_integer(
                totals["input_tokens"], _consumer_weights(candidates, "input_tokens")
            ),
            "output_tokens": _allocate_integer(
                totals["output_tokens"], _consumer_weights(candidates, "output_tokens")
            ),
            "spend_usd": _allocate_decimal(
                totals["spend_usd"], _consumer_weights(candidates, "spend_usd")
            ),
        }
        data = [
            {
                **candidate,
                "requests": allocations["requests"][index],
                "input_tokens": allocations["input_tokens"][index],
                "output_tokens": allocations["output_tokens"][index],
                "spend_usd": allocations["spend_usd"][index],
            }
            for index, candidate in enumerate(candidates)
        ]

    return {
        "object": "usage_consumers",
        "start": start,
        "end": end,
        "filters": {"api_key_id": api_key_id, "model": model},
        "data": data,
    }


class SpendLimitRequest(BaseModel):
    scope: Literal["account", "api_key"] = Field(
        ..., description="Apply the limit account-wide or to a specific key."
    )
    api_key_id: str | None = Field(
        None, description="Required when scope='api_key'."
    )
    monthly_limit_usd: float = Field(..., gt=0)
    alert_thresholds_pct: list[int] = Field(
        default_factory=lambda: [50, 80, 100],
        description="Send a webhook/email at each of these % of the limit.",
    )


@router.post("/spend-limits", status_code=201)
async def create_spend_limit(req: SpendLimitRequest):
    if req.scope == "api_key" and not req.api_key_id:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "type": "invalid_argument",
                    "message": "api_key_id is required when scope='api_key'.",
                }
            },
        )
    if req.scope == "api_key":
        existing = store.get_api_key(req.api_key_id)  # type: ignore[arg-type]
        if not existing:
            raise HTTPException(
                status_code=404,
                detail={
                    "error": {
                        "type": "not_found",
                        "message": f"API key '{req.api_key_id}' not found.",
                    }
                },
            )
        store.update_api_key(
            req.api_key_id,  # type: ignore[arg-type]
            {"spend_limit_usd": req.monthly_limit_usd},
        )
    return {
        "id": "lim_" + hashlib.md5(req.model_dump_json().encode()).hexdigest()[:24],
        "scope": req.scope,
        "api_key_id": req.api_key_id,
        "monthly_limit_usd": req.monthly_limit_usd,
        "alert_thresholds_pct": req.alert_thresholds_pct,
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
