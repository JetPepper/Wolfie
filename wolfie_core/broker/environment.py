ENVIRONMENT = "SIMULATED_LIVE_MCP_LOCAL"
SOURCE_MODE = "simulated"
MCP_SERVER_NAME = "RobinhoodSimMCPServer"
EXECUTION_ENGINE = "PaperExchange"
MARKET_DATA_MODE = "SIM_STATIC_FIXTURE"

TRUTH_STATE = {
    "environment": ENVIRONMENT,
    "broker_interface": "Robinhood-compatible MCP simulation",
    "execution": EXECUTION_ENGINE,
    "real_robinhood_connected": False,
    "robinhood_login_required": False,
    "live_order_submitted": False,
    "real_money_at_risk": False,
    "market_data_mode": MARKET_DATA_MODE,
}
