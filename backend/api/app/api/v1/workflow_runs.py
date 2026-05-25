from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_assistant_agent,
    get_current_user_db,
    get_optional_current_user_db,
)
from app.db.crud import create_workflow_run, list_workflow_runs_for_user
from app.db.models import User
from app.db.session import get_db_session
from app.models.workflow_runs import WorkflowRunCreateRequest, WorkflowRunResponse
from app.services.assistant_agent import AssistantAgent

router = APIRouter()


@router.post("", response_model=WorkflowRunResponse)
async def create_tracked_workflow_run(
    payload: WorkflowRunCreateRequest,
    current_user_db: User | None = Depends(get_optional_current_user_db),
    agent: AssistantAgent = Depends(get_assistant_agent),
    session: AsyncSession = Depends(get_db_session),
) -> WorkflowRunResponse:
    # If the caller claims this run came from an assistant session, the
    # session must actually exist and either be anonymous or owned by them.
    # Without this check, a logged-in caller can fabricate runs citing
    # arbitrary session IDs and pollute the launch-source analytics.
    if payload.assistant_session_id:
        assistant_state = await agent.session_service.get_session(
            payload.assistant_session_id
        )
        if assistant_state is None:
            raise HTTPException(status_code=404, detail="Assistant session not found")
        owner = assistant_state.owner_keycloak_sub
        caller_sub = current_user_db.keycloak_sub if current_user_db else None
        if owner is not None and owner != caller_sub:
            raise HTTPException(
                status_code=403,
                detail="Assistant session belongs to another user",
            )

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
