from statistics import mean
from typing import Any, Dict, List

from wolfie_core.signals.schema import make_signal


class BaseStrategy:
    strategy_id = "base"
    strategy_name = "Base Strategy"
    setup_type = "UNKNOWN"
    required_inputs = ["quote", "candles"]

    def run(self, symbol: str, quote: Dict[str, Any], candles: List[Dict[str, Any]]) -> Dict[str, Any]:
        missing = []
        if not quote or quote.get("last") is None:
            missing.append("quote")
        if not candles:
            missing.append("candles")
        if missing:
            return self._stable(make_signal(self.strategy_id, self.strategy_name, symbol, "HOLD", 0, self.setup_type, {"missing_inputs": missing}, self.required_inputs, {}, missing_inputs=missing), symbol)
        return self._stable(self._run(symbol, quote, candles), symbol)

    def _run(self, symbol: str, quote: Dict[str, Any], candles: List[Dict[str, Any]]) -> Dict[str, Any]:
        return make_signal(self.strategy_id, self.strategy_name, symbol, "HOLD", 40, "NO_TRADE", {"reason": "base"}, self.required_inputs, {"quote": quote, "candles": len(candles)})

    def _closes(self, candles):
        return [candle["close"] for candle in candles if candle.get("close") is not None]

    def _volumes(self, candles):
        return [candle["volume"] for candle in candles if candle.get("volume") is not None]

    def _stable(self, signal, symbol):
        signal["signal_id"] = f"signal_{self.strategy_id}_{symbol}"
        signal["created_at"] = "SIMULATED_FIXTURE_TIME"
        signal["provenance"]["generated_at"] = "SIMULATED_FIXTURE_TIME"
        return signal


class RSIMeanReversionStrategy(BaseStrategy):
    strategy_id = "rsi_mean_reversion"
    strategy_name = "RSI Mean Reversion"
    setup_type = "RSI_MEAN_REVERSION"

    def _run(self, symbol, quote, candles):
        closes = self._closes(candles)
        deltas = [closes[i] - closes[i - 1] for i in range(1, len(closes))]
        gains = [delta for delta in deltas if delta > 0]
        losses = [abs(delta) for delta in deltas if delta < 0]
        rsi = 50 if not deltas or not losses else 100 - (100 / (1 + (mean(gains or [0.01]) / mean(losses))))
        side = "BUY" if rsi < 35 else "SELL" if rsi > 65 else "HOLD"
        confidence = 72 if side != "HOLD" else 45
        return make_signal(self.strategy_id, self.strategy_name, symbol, side, confidence, self.setup_type, {"rsi": round(rsi, 2)}, self.required_inputs, {"last": quote["last"], "candles": len(candles)})


class MovingAverageCrossoverStrategy(BaseStrategy):
    strategy_id = "moving_average_crossover"
    strategy_name = "Moving Average Crossover"
    setup_type = "MOVING_AVERAGE_CROSSOVER"

    def _run(self, symbol, quote, candles):
        closes = self._closes(candles)
        fast = mean(closes[-3:])
        slow = mean(closes[-5:]) if len(closes) >= 5 else mean(closes)
        side = "BUY" if fast > slow else "SELL" if fast < slow else "HOLD"
        return make_signal(self.strategy_id, self.strategy_name, symbol, side, 68 if side != "HOLD" else 40, self.setup_type, {"fast_ma": round(fast, 4), "slow_ma": round(slow, 4)}, self.required_inputs, {"last": quote["last"], "candles": len(candles)})


class Breakout20DStrategy(BaseStrategy):
    strategy_id = "breakout_20d"
    strategy_name = "20-Day Breakout"
    setup_type = "BREAKOUT_20D"

    def _run(self, symbol, quote, candles):
        highs = [candle["high"] for candle in candles if candle.get("high") is not None]
        prior_high = max(highs[:-1] or highs)
        side = "BUY" if quote["last"] >= prior_high else "HOLD"
        return make_signal(self.strategy_id, self.strategy_name, symbol, side, 76 if side == "BUY" else 42, self.setup_type, {"prior_high": prior_high, "last": quote["last"]}, self.required_inputs, {"last": quote["last"], "candles": len(candles)})


class VWAPReclaimStrategy(BaseStrategy):
    strategy_id = "vwap_reclaim"
    strategy_name = "VWAP Reclaim"
    setup_type = "VWAP_RECLAIM"

    def _run(self, symbol, quote, candles):
        closes = self._closes(candles)
        volumes = self._volumes(candles)
        vwap = sum(price * volume for price, volume in zip(closes, volumes)) / sum(volumes)
        side = "BUY" if quote["last"] > vwap else "HOLD"
        return make_signal(self.strategy_id, self.strategy_name, symbol, side, 66 if side == "BUY" else 38, self.setup_type, {"vwap": round(vwap, 4)}, self.required_inputs, {"last": quote["last"], "volume": quote.get("volume")})


class OpeningRangeBreakoutStrategy(BaseStrategy):
    strategy_id = "opening_range_breakout"
    strategy_name = "Opening Range Breakout"
    setup_type = "OPENING_RANGE_BREAKOUT"

    def _run(self, symbol, quote, candles):
        first = candles[0]
        side = "BUY" if quote["last"] > first["high"] else "SELL" if quote["last"] < first["low"] else "HOLD"
        return make_signal(self.strategy_id, self.strategy_name, symbol, side, 64 if side != "HOLD" else 35, self.setup_type, {"opening_high": first["high"], "opening_low": first["low"]}, self.required_inputs, {"last": quote["last"]})


class RelativeStrengthContinuationStrategy(BaseStrategy):
    strategy_id = "relative_strength_continuation"
    strategy_name = "Relative Strength Continuation"
    setup_type = "RELATIVE_STRENGTH_CONTINUATION"

    def _run(self, symbol, quote, candles):
        closes = self._closes(candles)
        change = (closes[-1] - closes[0]) / closes[0]
        side = "BUY" if change > 0.005 and quote.get("volume", 0) > 0 else "HOLD"
        return make_signal(self.strategy_id, self.strategy_name, symbol, side, 70 if side == "BUY" else 40, self.setup_type, {"fixture_period_change": round(change, 5)}, self.required_inputs, {"last": quote["last"], "volume": quote.get("volume")})


def default_strategies():
    return [
        RSIMeanReversionStrategy(),
        MovingAverageCrossoverStrategy(),
        Breakout20DStrategy(),
        VWAPReclaimStrategy(),
        OpeningRangeBreakoutStrategy(),
        RelativeStrengthContinuationStrategy(),
    ]
