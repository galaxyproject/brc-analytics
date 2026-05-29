"""F3: SRA eval datasets must surface a clear requirement when
SRA_MIRROR_PATH is unset, instead of registering zero SRA tools and
letting every case score a misleading flat 0.0.
"""

from unittest.mock import MagicMock

import pytest

from evals.datasets import sra_assistant_multiturn, sra_tool_selection
from evals.tasks import DatasetRequirementError, EvalDeps

SRA_MODULES = [sra_tool_selection, sra_assistant_multiturn]


def _deps(sra_mirror):
    return EvalDeps(
        settings=MagicMock(),
        cache=MagicMock(),
        catalog=MagicMock(),
        sra_mirror=sra_mirror,
    )


@pytest.mark.parametrize("module", SRA_MODULES)
def test_build_raises_when_no_mirror(module):
    with pytest.raises(DatasetRequirementError, match="SRA_MIRROR_PATH"):
        module.build(_deps(None), MagicMock(), MagicMock(), None)


@pytest.mark.parametrize("module", SRA_MODULES)
def test_build_raises_when_mirror_unavailable(module):
    mirror = MagicMock()
    mirror.is_available.return_value = False
    with pytest.raises(DatasetRequirementError, match="SRA_MIRROR_PATH"):
        module.build(_deps(mirror), MagicMock(), MagicMock(), None)
