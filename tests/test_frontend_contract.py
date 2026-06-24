from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "apps" / "web"
PUBLIC = WEB / "public"
API_ROUTE = WEB / "app" / "api" / "waitlist" / "route.ts"
NEXT_CONFIG = WEB / "next.config.ts"


def read(path: Path) -> str:
    return path.read_text()


def test_uploaded_static_site_is_the_public_landing_surface():
    index = PUBLIC / "index.html"
    privacy = PUBLIC / "privacy.html"
    terms = PUBLIC / "terms.html"

    assert index.exists()
    assert privacy.exists()
    assert terms.exists()

    html = read(index)
    assert "Wolfie — Autonomous AI Trading Agents for Robinhood" in html
    assert "The <span class=\"glow\">unfair advantage</span>" in html
    assert "Join the pack." in html
    assert "function submitWaitlist" in html
    assert "fetch('/api/waitlist/'" in html
    assert "TODO: wire to real backend" not in html


def test_old_landing_and_generated_site_files_are_removed():
    removed_paths = [
        WEB / "app" / "page.tsx",
        WEB / "app" / "globals.css",
        WEB / "app" / "waitlist",
        ROOT / "apps" / "site",
        PUBLIC / "wolfie-hero-suite-bg.png",
        PUBLIC / "wolfie-waitlist-card-reference.png",
        PUBLIC / "wolfie-landing-hero-laptop.png",
        PUBLIC / "source-icon-dashboard.png",
        PUBLIC / "wolfie-logo.svg",
    ]

    for path in removed_paths:
        assert not path.exists(), f"old landing artifact remains: {path}"


def test_static_routes_point_to_uploaded_files():
    config = read(NEXT_CONFIG)
    assert 'source: "/"' in config
    assert 'destination: "/index.html"' in config
    assert 'source: "/privacy"' in config
    assert 'destination: "/privacy.html"' in config
    assert 'source: "/terms"' in config
    assert 'destination: "/terms.html"' in config


def test_uploaded_form_fields_are_mapped_to_backend_and_xlsx():
    html = read(PUBLIC / "index.html")
    api = read(API_ROUTE)

    for field_id in ["wl-name", "wl-email", "wl-exp", "wl-int"]:
        assert f'id="{field_id}"' in html
        assert field_id in api or field_id.replace("wl-", "") in api

    for backend_field in ["fullName", "emailAddress", "tradingExperience", "interest"]:
        assert backend_field in html
        assert backend_field in api

    for header in [
        "Full Name",
        "Email Address",
        "Trading Experience",
        "Interest",
        "Submission Count",
    ]:
        assert header in api

    assert "XLSX.write(workbook" in api
    assert "writeFileSync(workbookPath" in api
    assert "WOLFIE_WAITLIST_XLSX_PATH" in api
    assert "WOLFIE_WAITLIST_EMAIL_MODE" in api
    assert "RESEND_API_KEY" in api
