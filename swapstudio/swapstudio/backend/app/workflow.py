"""Load the API-format workflow and patch it by node title (never by node id)."""
from __future__ import annotations

import copy
import json
from dataclasses import dataclass
from pathlib import Path

REQUIRED_TITLES = ("IN_PROMPT", "IN_IMAGE", "IN_VIDEO", "IN_DURATION", "IN_SEED", "OUT_VIDEO")

# Which input field each titled node receives. "auto_text" = the node's main text widget.
FIELD_CANDIDATES: dict[str, tuple[str, ...]] = {
    "IN_PROMPT": ("prompt", "text", "positive_prompt", "auto_text"),
    "IN_IMAGE": ("image",),
    "IN_VIDEO": ("video",),
    "IN_DURATION": ("value",),
    "IN_SEED": ("noise_seed", "seed"),
    "OUT_VIDEO": ("filename_prefix",),
}


class WorkflowError(Exception):
    pass


@dataclass
class SwapParams:
    prompt: str
    image_name: str
    video_name: str
    duration: float
    seed: int
    output_prefix: str


def load_workflow(path: Path) -> dict:
    if not path.exists():
        raise WorkflowError(
            f"Workflow not found: {path}. Open workflows/character_swap.ui.json in ComfyUI "
            "and use Workflow > Export (API) to save it at this path."
        )
    data = json.loads(path.read_text(encoding="utf-8"))
    if "nodes" in data and "links" in data:
        raise WorkflowError(
            f"{path.name} is in UI format. Export it with Workflow > Export (API) instead."
        )
    validate_workflow(data)
    return data


def find_node(wf: dict, title: str) -> dict:
    matches = [n for n in wf.values() if n.get("_meta", {}).get("title") == title]
    if not matches:
        raise WorkflowError(f"No node titled '{title}' in the workflow.")
    if len(matches) > 1:
        raise WorkflowError(f"More than one node titled '{title}'.")
    return matches[0]


def resolve_field(node: dict, title: str) -> str:
    inputs = node.get("inputs", {})
    for cand in FIELD_CANDIDATES[title]:
        if cand == "auto_text":
            texts = [k for k, v in inputs.items() if isinstance(v, str)]
            if texts:
                return max(texts, key=lambda k: len(inputs[k]))
        elif cand in inputs and not isinstance(inputs[cand], list):
            return cand
    raise WorkflowError(
        f"Node '{title}' ({node.get('class_type')}) has none of the expected inputs "
        f"{FIELD_CANDIDATES[title]}. Inputs found: {list(inputs)}"
    )


def validate_workflow(wf: dict) -> dict[str, str]:
    """Check that every titled node exists and has a patchable field. Returns title -> field."""
    return {t: resolve_field(find_node(wf, t), t) for t in REQUIRED_TITLES}


def build_prompt_graph(base: dict, p: SwapParams) -> dict:
    wf = copy.deepcopy(base)
    values = {
        "IN_PROMPT": p.prompt,
        "IN_IMAGE": p.image_name,
        "IN_VIDEO": p.video_name,
        "IN_DURATION": round(p.duration, 3),
        "IN_SEED": int(p.seed),
        "OUT_VIDEO": p.output_prefix,
    }
    for title, value in values.items():
        node = find_node(wf, title)
        node["inputs"][resolve_field(node, title)] = value
    return wf
