# agents/src/common/base_agent.py

from abc import ABC, abstractmethod
from src.common.context import AgentContext
from src.common.llm_client import LlmClient

class BaseAgent(ABC):
    def __init__(self, name: str):
        self.name = name
        self.llm = LlmClient()

    @abstractmethod
    def run(self, context: AgentContext) -> AgentContext:
        """
        Abstract method representing the core logic of the agent.
        Every agent must implement this method.
        """
        pass

    def log_start(self, context: AgentContext, message: str = "Agent started execution."):
        print(f"[{self.name}] {message}")
        context.log(self.name, "started", message, llm_model=getattr(self.llm, "model", None))

    def log_success(self, context: AgentContext, message: str = "Agent completed execution.", duration_seconds: float = 0.0, input_tokens: int = 0, output_tokens: int = 0):
        print(f"[{self.name}] {message} (Duration: {duration_seconds:.2f}s)")
        context.log(
            self.name, 
            "completed", 
            message, 
            duration_seconds=duration_seconds, 
            input_tokens=input_tokens, 
            output_tokens=output_tokens, 
            llm_model=getattr(self.llm, "model", None)
        )

    def log_failure(self, context: AgentContext, error: str, duration_seconds: float = 0.0):
        message = f"Agent failed: {error}"
        print(f"[{self.name}] ERROR: {message}")
        context.log(
            self.name, 
            "failed", 
            message, 
            duration_seconds=duration_seconds, 
            llm_model=getattr(self.llm, "model", None)
        )
