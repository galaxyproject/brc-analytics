from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user_db, get_optional_current_user_db
from app.db.crud import create_workflow_run, list_workflow_runs_for_user
from app.db.models import User
from app.db.session import get_db_session
from app.models.workflow_runs import WorkflowRunCreateRequest, WorkflowRunResponse

router = APIRouter()


@router.post("", response_model=WorkflowRunResponse)
async def create_tracked_workflow_run(
    payload: WorkflowRunCreateRequest,
    current_user_db: User | None = Depends(get_optional_current_user_db),
    session: AsyncSession = Depends(get_db_session),
) -> WorkflowRunResponse:
    workflow_run = await create_workflow_run(
        session,
        current_user_db,
        workflow_trs_id=payload.workflow_trs_id,
        workflow_id=payload.workflow_id,
        galaxy_instance_url=payload.galaxy_instance_url,
        handoff_url=payload.handoff_url,
        assembly_accession=payload.assembly_accession,
        launch_source=payload.launch_source,
        assistant_session_id=payload.assistant_session_id,
        parameters=payload.parameters,
    )
    return WorkflowRunResponse.model_validate(workflow_run, from_attributes=True)


@router.get("", response_model=list[WorkflowRunResponse])
async def get_workflow_runs(
    current_user_db: User = Depends(get_current_user_db),
    session: AsyncSession = Depends(get_db_session),
) -> list[WorkflowRunResponse]:
    workflow_runs = await list_workflow_runs_for_user(session, current_user_db)
    return [
        WorkflowRunResponse.model_validate(workflow_run, from_attributes=True)
        for workflow_run in workflow_runs
    ]
