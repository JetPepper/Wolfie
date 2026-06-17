from datetime import datetime, timezone
from typing import Any, Dict
from uuid import uuid4

from wolfie_core.broker.environment import MCP_SERVER_NAME, SOURCE_MODE


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def provenance(source_name: str = MCP_SERVER_NAME) -> Dict[str, Any]:
    return {
        "source_name": source_name,
        "source_mode": SOURCE_MODE,
        "mcp_server": MCP_SERVER_NAME,
        "generated_at": now_iso(),
    }


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex}"

