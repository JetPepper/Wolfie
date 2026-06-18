from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WEB_APP = ROOT / "apps" / "web" / "app"


def read(path: Path) -> str:
    return path.read_text()


def test_master_prompt_navigation_and_mode_contract():
    shell = read(WEB_APP / "wolfie-dashboard.tsx")
    assert "Trading Bots" in shell
    assert "Trading Mode" in shell
    assert "Simulated" in shell
    assert "Live" in shell
    assert "Paper Activity" not in visible_text_source(shell)
    assert "Deploy Bot" not in visible_text_source(shell)


def test_onboarding_capital_step_exists_and_validates():
    shell = read(WEB_APP / "wolfie-dashboard.tsx")
    for text in [
        "How much do you want Wolfie to trade with?",
        "This sets your starting trading capital.",
        "$10,000",
        "Continue",
        "parseCapitalInput",
        "localStorage",
    ]:
        assert text in shell


def test_visible_controls_have_stateful_handlers():
    shell = read(WEB_APP / "wolfie-dashboard.tsx")
    for hook in [
        "setActiveSection",
        "setTradingMode",
        "setExpandedCard",
        "setSelectedBotId",
        "setTickerEditorOpen",
        "setSigIntPreview",
        "setCapitalAmount",
        "updateSelectedBot",
        "executeBotTrade",
    ]:
        assert hook in shell


def test_overview_cards_and_sigint_are_interactive():
    shell = read(WEB_APP / "wolfie-dashboard.tsx")
    for text in [
        "OverviewCard",
        "ExpandedCardDialog",
        "SignalIntelligenceGraph",
        "SigINTPreviewPanel",
        "sourceUrl",
        "View all activity",
        "View All Positions",
    ]:
        assert text in shell


def test_trading_bots_page_has_required_bot_controls():
    shell = read(WEB_APP / "wolfie-dashboard.tsx")
    for text in [
        "Conservative",
        "Balanced",
        "Aggressive",
        "Politicians",
        "Allocation mode",
        "Fixed",
        "Relative",
        "Additional Settings",
        "Require Approval",
        "Autopilot",
        "Activate Bot",
        "Update Bot",
        "Pause Bot",
        "Resume Bot",
    ]:
        assert text in shell
    assert "AAPL ×" not in shell
    assert "Auto Paper" not in shell
    assert "Bot Mode" not in visible_text_source(shell)


def test_ticker_and_profit_loss_popup_exist():
    shell = read(WEB_APP / "wolfie-dashboard.tsx")
    for text in [
        "EditableScrollingTicker",
        "tickerCategories",
        "ProfitLossToast",
        "playProfitChime",
        "Closed Position Results",
    ]:
        assert text in shell


def test_no_brokerage_warning_language_in_visible_ui():
    shell = visible_text_source(read(WEB_APP / "wolfie-dashboard.tsx"))
    blocked = [
        "PaperExchange",
        "Paper Activity",
        "paper account",
        "paper trading",
        "MCP TOOL CALL",
        "BotConfig",
        "mock",
        "sandbox",
        "brokerage disconnected",
    ]
    for text in blocked:
        assert text.lower() not in shell.lower()


def test_metric_cards_use_professional_non_character_wrapping():
    shell = read(WEB_APP / "wolfie-dashboard.tsx")
    assert "professionalMetricGrid" in shell
    assert "tabular-nums whitespace-nowrap" in shell
    assert "overflow-hidden text-ellipsis" in shell
    metric_card = shell.split("function OverviewCard", 1)[1].split("function ExpandedCardDialog", 1)[0]
    assert "break-all" not in metric_card
    assert "break-words font-mono text-2xl" not in metric_card


def test_readme_documents_local_ui_workflows():
    readme = read(ROOT / "README.md")
    for text in [
        "NEXT_PUBLIC_API_BASE_URL",
        "http://localhost:3000",
        "scripts/dev-local.sh",
    ]:
        assert text in readme


def test_local_launch_script_exists_and_runs_backend_frontend():
    script = read(ROOT / "scripts" / "dev-local.sh")
    assert "uvicorn apps.api.main:app" in script
    assert "next dev -p 3000" in script
    assert "NEXT_PUBLIC_API_BASE_URL" in script


def visible_text_source(shell: str) -> str:
    """Approximate user-facing string scan while ignoring type/function/internal safety names."""
    lines = []
    for line in shell.splitlines():
        stripped = line.strip()
        if stripped.startswith("const order") or stripped.startswith("function money"):
            continue
        if "sourceMode" in stripped or "source_mode" in stripped or "execution_engine" in stripped:
            continue
        lines.append(line)
    return "\n".join(lines)
