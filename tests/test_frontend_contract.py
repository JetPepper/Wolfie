from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "apps" / "web" / "app" / "page.tsx"
CSS = ROOT / "apps" / "web" / "app" / "globals.css"
FORMAT = ROOT / "apps" / "web" / "app" / "lib" / "format.ts"
FEES = ROOT / "apps" / "web" / "app" / "lib" / "fees.ts"


def read(path: Path) -> str:
    return path.read_text()


def test_navigation_and_removed_copy_contract():
    shell = read(PAGE)
    visible_blocked = [
        "Wolfie Alpha",
        "Trading Bots",
        "Wolfie Command Dashboard",
        "Active bot",
        "Selected Thought",
        "Field Navigator",
        "Bot Thought Preview",
        "returns unknown",
    ]
    for text in ["Dashboard", "Bots", "Signal Console", "Activity", "Settings"]:
        assert text in shell
    for text in visible_blocked:
        assert text not in shell


def test_onboarding_starting_capital_and_money_formatting_exist():
    shell = read(PAGE)
    fmt = read(FORMAT)
    for text in [
        "How much do you want Wolfie to trade with?",
        "Starting Capital",
        "formatMoney",
        "minimumFractionDigits: 2",
        "maximumFractionDigits: 2",
    ]:
        assert text in shell or text in fmt


def test_bots_have_deployment_and_settings_behavior():
    shell = read(PAGE)
    for text in [
        "enabled: false",
        "Deploy {bot.name}",
        "Allocation Mode",
        "Fixed Dollar Allocation",
        "Percentage of Available Capital",
        "Max Position Size",
        "Stop-Loss",
        "Take-Profit",
        "rejectedSignals",
        "Current analysis inputs",
    ]:
        assert text in shell


def test_disclosure_and_other_bots_sections_exist_without_fake_returns():
    shell = read(PAGE)
    for text in [
        "Public Disclosure Bots",
        "Politicians",
        "Public Figures",
        "Insiders",
        "Disclosure Cluster Scout",
        "Other Bots",
        "Custom watchlist bot",
        "Awaiting audited return feed",
    ]:
        assert text in shell
    assert "Not ranked" not in shell


def test_signal_intelligence_contract():
    shell = read(PAGE)
    for text in [
        "Signal Console",
        "Time Scrub",
        "Bot Lens",
        "Market Processing Queue",
        "Research Density",
        "Rejected Alternatives",
        "source",
        "OrbitControls",
    ]:
        assert text in shell


def test_activity_settings_sound_and_provider_contract():
    shell = read(PAGE)
    fees = read(FEES)
    for text in [
        "Enable Trade Sounds",
        "playProfitChime",
        "Provider Status",
        "Live Market Feed",
        "News and Trends",
        "Public source links",
        "Simulated / Live",
        "Live trading is gated.",
        "robinhoodStyleFeeSchedule",
        "verifiedOn: \"2026-06-19\"",
        "secSection31RatePerMillionSellPrincipal: 20.6",
        "finraTradingActivityFeePerShareSell: 0.000166",
    ]:
        assert text in shell or text in fees


def test_bot_animation_is_scoped_and_no_broken_image_path_contract():
    css = read(CSS)
    shell = read(PAGE)
    for text in ["botIdle", "botPersonality", "botBlink", "prefers-reduced-motion"]:
        assert text in css
    for blocked in ["starDrift", "tickerRun", "corePulse", "nodeFloat", "avatarBreathe"]:
        assert blocked not in css
    assert "<img" not in shell
    assert "Configuration required" not in shell
