from __future__ import annotations

from typing import Any

from wolfie_core.broker.environment import ENVIRONMENT
from wolfie_core.mcp.robinhood_sim import RobinhoodSimMCPServer


class ModeNotEnabled(NotImplementedError):
    pass


class MCPContractAdapter:
    SUPPORTED_MODE = "SIMULATED_LIVE_MCP_LOCAL"
    FUTURE_MODES = {"ROBINHOOD_MCP_PAPER_ONLY", "ROBINHOOD_LIVE_APPROVAL"}

    def __init__(self, mode: str = ENVIRONMENT, server: RobinhoodSimMCPServer | None = None):
        if mode in self.FUTURE_MODES:
            raise ModeNotEnabled(f"{mode} is a future-only disabled stub. No Robinhood connection exists.")
        if mode != self.SUPPORTED_MODE:
            raise ModeNotEnabled(f"{mode} is not enabled.")
        self.mode = mode
        self.server = server or RobinhoodSimMCPServer()

    def capabilities(self):
        return self.server.capabilities()

    def tools(self):
        return self.server.tools()

    def call(self, tool_name: str, **kwargs: Any):
        tool = getattr(self.server, tool_name, None)
        if tool is None or tool_name not in self.server.TOOLS:
            raise ValueError(f"Unknown MCP tool: {tool_name}")
        return tool(**kwargs)
