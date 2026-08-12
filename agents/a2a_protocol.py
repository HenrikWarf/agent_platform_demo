"""
Agent-to-Agent (A2A) Protocol Implementation for Google Cloud Agent Platform
Standardizes inter-agent message passing, task delegation, and context propagation.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Any, Optional, List, Callable
import uuid
import datetime
import logging

logger = logging.getLogger("a2a_protocol")

class A2AMessageType(str, Enum):
    REQUEST = "REQUEST"
    RESPONSE = "RESPONSE"
    HANDOFF = "HANDOFF"
    ERROR = "ERROR"

@dataclass
class A2AMessage:
    message_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str = ""
    receiver_id: str = ""
    task_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    message_type: A2AMessageType = A2AMessageType.REQUEST
    intent: str = ""
    payload: Dict[str, Any] = field(default_factory=dict)
    skill_used: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.datetime.utcnow().isoformat() + "Z")
    parent_message_id: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "message_id": self.message_id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "task_id": self.task_id,
            "message_type": self.message_type.value,
            "intent": self.intent,
            "payload": self.payload,
            "skill_used": self.skill_used,
            "timestamp": self.timestamp,
            "parent_message_id": self.parent_message_id,
        }

class A2ARouter:
    _instance = None
    _agents: Dict[str, Any] = {}
    _message_history: List[A2AMessage] = []

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(A2ARouter, cls).__new__(cls)
            cls._instance._agents = {}
            cls._instance._message_history = []
        return cls._instance

    def register_agent(self, agent_id: str, agent_instance: Any):
        self._agents[agent_id] = agent_instance
        logger.info(f"A2ARouter: Registered agent '{agent_id}'")

    def route_message(self, message: A2AMessage) -> A2AMessage:
        self._message_history.append(message)
        logger.info(f"A2A [{message.sender_id} -> {message.receiver_id}] Intent: {message.intent}")

        if message.receiver_id not in self._agents:
            err_msg = A2AMessage(
                sender_id="A2ARouter",
                receiver_id=message.sender_id,
                task_id=message.task_id,
                message_type=A2AMessageType.ERROR,
                intent="AGENT_NOT_FOUND",
                payload={"error": f"Agent '{message.receiver_id}' is not registered in A2A Router"},
                parent_message_id=message.message_id
            )
            self._message_history.append(err_msg)
            return err_msg

        target_agent = self._agents[message.receiver_id]
        response = target_agent.handle_a2a_message(message)
        self._message_history.append(response)
        return response

    def get_history(self) -> List[Dict[str, Any]]:
        return [m.to_dict() for m in self._message_history]

    def clear_history(self):
        self._message_history = []
