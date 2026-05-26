from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, func
from app.core.database import Base

class CandidateEditHistory(Base):
    """
    Stores an audit trail of changes made to a candidate profile.
    Table name: candidate_edit_history
    """
    __tablename__ = "candidate_edit_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    updated_by = Column(String(255), nullable=True)
    updated_at = Column(DateTime, nullable=False, server_default=func.now())
    changed_fields = Column(Text, nullable=True)    # JSON: list of field names that changed
    previous_values = Column(Text, nullable=True)   # JSON: {field: old_value}
    new_values = Column(Text, nullable=True)        # JSON: {field: new_value}
