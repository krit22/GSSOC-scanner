"""GSSoC / assignment claim detection patterns."""

from __future__ import annotations

import re

CLAIM_PATTERNS = re.compile(
    r"|".join(
        [
            r"gssoc",
            r"gssoc'?26",
            r"girlscript",
            r"please assign",
            r"kindly assign",
            r"assign (?:this |it )?to me",
            r"can you assign",
            r"could you assign",
            r"would like to work",
            r"i['']?d like to work",
            r"i would like to work",
            r"i am a .*contributor",
            r"i['']?m a .*contributor",
            r"contributor under gssoc",
            r"/assign\b",
        ]
    ),
    re.IGNORECASE,
)


def has_claim_text(text: str | None, extra_pattern: re.Pattern | None = None) -> bool:
    pattern = extra_pattern or CLAIM_PATTERNS
    return bool(pattern.search(text or ""))


def has_claim_comment(bodies: list[str], extra_pattern: re.Pattern | None = None) -> bool:
    return any(has_claim_text(body, extra_pattern) for body in bodies)
