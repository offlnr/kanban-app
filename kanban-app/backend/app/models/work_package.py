from sqlalchemy import String, ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class WorkPackage(Base):
    __tablename__ = "work_packages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    phase_id: Mapped[int] = mapped_column(ForeignKey("phases.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    acceptance_criteria: Mapped[str] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    phase: Mapped["Phase"] = relationship("Phase", back_populates="work_packages")
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="work_package")
