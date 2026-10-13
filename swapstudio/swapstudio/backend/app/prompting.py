"""Build the swap prompt from structured fields so artists never write the raw prompt."""
from pydantic import BaseModel, Field


class PromptFields(BaseModel):
    target: str = Field("the woman dancing in the center", max_length=200)
    character: str = Field("", max_length=400, description="Short description of the reference character")
    footwear: str = Field("as in the reference", max_length=100)
    keep_text: bool = True
    extra: str = Field("", max_length=500)


def build_prompt(f: PromptFields) -> str:
    character = f.character.strip() or "identity, hairstyle, outfit, and accessories"
    parts = [
        f"Replace only {f.target.strip()} in <Video 1> with the character from <Picture 1>. "
        "All views in <Picture 1> show the same single character; use them only as identity reference.",
        f"Keep the character's {character} exactly as in <Picture 1> for the entire video, "
        "ignoring any clothing changes of the original person.",
    ]
    if f.footwear.strip() and f.footwear.strip() != "as in the reference":
        parts.append(f"Footwear: {f.footwear.strip()}.")
    parts.append(
        "Match the original person's position, scale, pose, movements, facial expressions, and timing "
        "frame by frame. Relight the character to match the scene lighting with natural shadows."
    )
    keep = "camera, framing, background, objects, and all other people"
    if f.keep_text:
        parts.append(f"Preserve everything else from <Video 1> unchanged: {keep}, and on-screen text.")
    else:
        parts.append(f"Preserve everything else from <Video 1> unchanged: {keep}. Remove all on-screen text.")
    if f.extra.strip():
        parts.append(f.extra.strip())
    parts.append("Show only one character; no reference sheet layout, gray background, or labels.")
    return " ".join(parts)
