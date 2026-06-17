from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WEB_APP = ROOT / "apps" / "web" / "app"


def read(path: Path) -> str:
    return path.read_text()


def test_localhost_app_shell_exposes_required_navigation_sections():
    shell = read(WEB_APP / "wolfie-dashboard.tsx")
    for label in [
        "Live Info",
        "MCP Simulation",
        "Paper Account",
        "Strategy Signals",
        "Scenario Lab",
        "Insider Radar",
        "Market Influence",
        "Fused Signals",
        "Audit Log",
        "Settings",
    ]:
        assert label in shell


def test_truth_banner_and_simulated_execution_labels_are_global():
    shell = read(WEB_APP / "wolfie-dashboard.tsx")
    for label in [
        "Environment",
        "SIMULATED_LIVE_MCP_LOCAL",
        "Broker interface",
        "Robinhood-compatible MCP simulation",
        "Execution",
        "PaperExchange",
        "Real Robinhood connected",
        "false",
        "Robinhood login required",
        "Live order submitted",
        "Real money at risk",
    ]:
        assert label in shell


def test_required_frontend_components_exist():
    shell = read(WEB_APP / "wolfie-dashboard.tsx")
    for component in [
        "AppShell",
        "CommandBar",
        "TruthBanner",
        "EnvironmentBadge",
        "BackendStatusBadge",
        "DataProvenanceChip",
        "MetricCard",
        "PositionCard",
        "OrderLifecycleTimeline",
        "SignalFeed",
        "RiskBlockCard",
        "CostPreviewCard",
        "ScenarioCard",
        "ReplayTimeline",
        "InsiderEventCard",
        "InfluenceEventCard",
        "FusedSignalCard",
        "AuditEventRow",
        "UnknownDataState",
        "SettingsPanel",
        "EmptyState",
        "LoadingState",
        "ErrorState",
    ]:
        assert f"function {component}" in shell


def test_truth_banner_shows_backend_market_and_source_mode():
    shell = read(WEB_APP / "wolfie-dashboard.tsx")
    dashboard_data = read(WEB_APP / "dashboard-data.ts")
    page = read(WEB_APP / "page.tsx")
    assert "Backend status" in shell
    assert "BackendStatusBadge" in shell
    assert "Market data mode" in shell
    assert "Current source mode" in shell
    assert "backendStatus" in dashboard_data
    assert 'getJson("/health"' in page


def test_paper_order_form_is_limit_only_and_routes_to_simulated_order_endpoints():
    shell = read(WEB_APP / "wolfie-dashboard.tsx")
    assert "ManualTestOrderForm" in shell
    assert "Limit orders only" in shell
    assert "/api/orders/preview" in shell
    assert "/api/orders/place" in shell
    assert '"order_type": "limit"' in shell
    assert 'value="market"' not in shell.lower()
    assert "market order" not in shell.lower()


def test_audit_log_displays_order_safety_fields_and_filters():
    shell = read(WEB_APP / "wolfie-dashboard.tsx")
    for label in ["live_order_submitted=false", "source_mode", "execution_engine", "event type", "order id", "strategy", "symbol"]:
        assert label in shell.lower()


def test_unknown_values_and_provenance_chips_are_visible():
    shell = read(WEB_APP / "wolfie-dashboard.tsx")
    assert "UNKNOWN" in shell
    assert "DataProvenanceChip" in shell
    assert "simulated/replay/fixture derived" in shell


def test_readme_documents_local_ui_workflows():
    readme = read(ROOT / "README.md")
    for text in [
        "NEXT_PUBLIC_API_BASE_URL",
        "http://localhost:3000",
        "scripts/dev-local.sh",
        "test simulated order flow from the UI",
        "load and replay a scenario from the UI",
        "inspect audit log from the UI",
    ]:
        assert text in readme


def test_local_launch_script_exists_and_runs_backend_frontend():
    script = read(ROOT / "scripts" / "dev-local.sh")
    assert "uvicorn apps.api.main:app" in script
    assert "next dev -p 3000" in script
    assert "NEXT_PUBLIC_API_BASE_URL" in script


def test_ui_uses_metallic_palette_shadows_and_wrap_safe_text():
    shell = read(WEB_APP / "wolfie-dashboard.tsx")
    assert "metallic-panel" in shell
    assert "metallic-card" in shell
    assert "shadow-[0_24px_90px_rgba" in shell
    assert "from-[#6EE7F9]" in shell
    assert "via-[#A78BFA]" in shell
    assert "to-[#FBBF24]" in shell
    assert "whitespace-normal" in shell
    assert "break-words" in shell
    assert "min-w-0" in shell


def test_provenance_chip_does_not_repeat_simulated_status_inside_cards():
    shell = read(WEB_APP / "wolfie-dashboard.tsx")
    assert 'const showStatus = normalized !== "simulated"' in shell
