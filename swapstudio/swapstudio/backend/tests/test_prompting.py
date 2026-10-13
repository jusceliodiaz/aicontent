from app.prompting import PromptFields, build_prompt


def test_default_prompt_keeps_tags_and_text():
    p = build_prompt(PromptFields())
    assert "<Video 1>" in p and "<Picture 1>" in p
    assert "on-screen text" in p and "Remove all" not in p


def test_options():
    p = build_prompt(PromptFields(target="the man on the left", footwear="white sneakers", keep_text=False,
                                  character="red updo, white one-shoulder dress"))
    assert "the man on the left" in p
    assert "Footwear: white sneakers." in p
    assert "Remove all on-screen text." in p
    assert "red updo" in p
