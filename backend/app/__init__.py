from app.schemas.role import (
    RoleBase,
    RoleCreate,
    RoleUpdate,
    RoleResponse,
)

from app.schemas.department import (
    DepartmentBase,
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
)

from app.schemas.production_line import (
    ProductionLineBase,
    ProductionLineCreate,
    ProductionLineUpdate,
    ProductionLineResponse,
)

from app.schemas.machine import (
    MachineBase,
    MachineCreate,
    MachineUpdate,
    MachineResponse,
)

from app.schemas.issue_category import (
    IssueCategoryBase,
    IssueCategoryCreate,
    IssueCategoryUpdate,
    IssueCategoryResponse,
)

from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
)

from app.schemas.incident import (
    IncidentBase,
    IncidentCreate,
    IncidentUpdate,
    IncidentResponse,
)

from app.schemas.ticket import (
    TicketBase,
    TicketCreate,
    TicketUpdate,
    TicketResponse,
)

from app.schemas.downtime_record import (
    DowntimeRecordBase,
    DowntimeRecordCreate,
    DowntimeRecordUpdate,
    DowntimeRecordResponse,
)

from app.schemas.rca_record import (
    RCARecordBase,
    RCARecordCreate,
    RCARecordUpdate,
    RCARecordResponse,
)

from app.schemas.capa_record import (
    CAPARecordBase,
    CAPARecordCreate,
    CAPARecordUpdate,
    CAPARecordResponse,
)

from app.schemas.resolution_record import (
    ResolutionRecordBase,
    ResolutionRecordCreate,
    ResolutionRecordUpdate,
    ResolutionRecordResponse,
)

from app.schemas.ml_prediction import (
    MLPredictionBase,
    MLPredictionCreate,
    MLPredictionUpdate,
    MLPredictionResponse,
)

from app.schemas.notification import (
    NotificationBase,
    NotificationCreate,
    NotificationUpdate,
    NotificationResponse,
)

from app.schemas.incident_activity_log import (
    IncidentActivityLogBase,
    IncidentActivityLogCreate,
    IncidentActivityLogUpdate,
    IncidentActivityLogResponse,
)