from server import db
from sqlalchemy import CheckConstraint, UniqueConstraint

# Association table only
task_dependencies = db.Table(
    "task_dependencies",
    db.Column("task_id", db.Integer, db.ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    db.Column("depends_on_id", db.Integer, db.ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
)

class Task(db.Model):
    #table name
    __tablename__ = "tasks"
    #table columns
    id = db.Column(db.Integer, primary_key=True)
    task_description = db.Column(db.Text, nullable=False, unique=True)
    deadline = db.Column(db.DateTime(timezone=True), nullable=False)
    status = db.Column(db.String, nullable=False, default="incomplete")
    level_priority = db.Column(db.String, nullable=False)

     # Self-referential many-to-many
    dependencies = db.relationship(
        "Task",
        secondary=task_dependencies,
        primaryjoin=id == task_dependencies.c.task_id,
        secondaryjoin=id == task_dependencies.c.depends_on_id,
        backref="dependents"
    )
    __table_args__ = (
        CheckConstraint(status.in_(["Incomplete", "Completed"]), name="check_status"),
        CheckConstraint(level_priority.in_(["Low", "Medium", "High"]), name="check_priority"),
    )

