import json
from pathlib import Path

import pytest

from app.workflow import SwapParams, WorkflowError, build_prompt_graph, load_workflow, validate_workflow

FIX = Path(__file__).parent / "fixtures" / "workflow_api.sample.json"
UI = Path(__file__).resolve().parents[2] / "workflows" / "character_swap.ui.json"


def params(**kw):
    base = dict(prompt="new prompt", image_name="c.png", video_name="s.mp4", duration=3.37, seed=42, output_prefix="out/x")
    return SwapParams(**{**base, **kw})


def test_patch_by_title_only_touches_targets():
    wf = json.loads(FIX.read_text())
    out = build_prompt_graph(wf, params())
    assert out["155"]["inputs"]["text"] == "new prompt"
    assert out["155"]["inputs"]["mode"] == "match"          # other string widget untouched
    assert out["155"]["inputs"]["clip"] == ["128", 0]       # links untouched
    assert out["159"]["inputs"]["image"] == "c.png"
    assert out["163"]["inputs"]["video"] == "s.mp4"
    assert out["133"]["inputs"]["value"] == 3.37
    assert out["129"]["inputs"]["noise_seed"] == 42
    assert out["151"]["inputs"]["filename_prefix"] == "out/x"
    assert out["124"] == wf["124"]                           # sampler settings untouched
    assert wf["155"]["inputs"]["text"] == "old prompt"      # base not mutated


def test_missing_title_is_reported():
    wf = json.loads(FIX.read_text())
    wf["129"]["_meta"]["title"] = "RandomNoise"
    with pytest.raises(WorkflowError, match="IN_SEED"):
        validate_workflow(wf)


def test_ui_format_rejected_with_hint():
    with pytest.raises(WorkflowError, match="Export"):
        load_workflow(UI)


def test_ui_workflow_has_all_titles():
    titles = {n.get("title") for n in json.loads(UI.read_text())["nodes"]}
    assert {"IN_PROMPT", "IN_IMAGE", "IN_VIDEO", "IN_DURATION", "IN_SEED", "OUT_VIDEO"} <= titles
