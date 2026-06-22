ENVIRONMENT = "LIVE_AGENT_BETA_PAPER_ONLY"
SOURCE_MODE = "public_source_acquisition"
MCP_SERVER_NAME = "NONE"
EXECUTION_ENGINE = "paper_only_execution"
MARKET_DATA_MODE = "ACQUISITION_LADDER"

TRUTH_STATE = {
    "environment": ENVIRONMENT,
    "broker_interface": "Live trading disabled; no broker connection in beta",
    "execution": EXECUTION_ENGINE,
    "real_robinhood_connected": False,
    "robinhood_login_required": False,
    "live_order_submitted": False,
    "real_money_at_risk": False,
    "market_data_mode": MARKET_DATA_MODE,
    "api_keys_required": False,
    "normal_data_path": "local real-data cache -> public sources -> public feeds -> discovery -> extraction -> corroboration -> optional APIs -> UNKNOWN",
}
